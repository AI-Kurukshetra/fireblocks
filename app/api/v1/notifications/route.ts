import { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NotificationItem } from '@/types'
import type { Database } from '@/types/database'

function isUnread(createdAt: string, forceUnread = false) {
  if (forceUnread) {
    return true
  }

  return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000
}

export const GET = withAuth(async (_request: NextRequest, { session }) => {
  const admin = createAdminClient()
  const [transactionsResult, systemResult, complianceResult, auditResult] = await Promise.all([
    admin
      .from('transactions')
      .select('*')
      .eq('organization_id', session.orgId)
      .in('status', ['pending', 'processing', 'approved', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(5),
    admin
      .from('system_health')
      .select('*')
      .eq('organization_id', session.orgId)
      .neq('status', 'online')
      .order('updated_at', { ascending: false })
      .limit(3),
    admin
      .from('compliance_records')
      .select('*')
      .eq('organization_id', session.orgId)
      .in('risk_level', ['high', 'critical'])
      .order('next_review', { ascending: true })
      .limit(3),
    admin
      .from('audit_logs')
      .select('*')
      .eq('organization_id', session.orgId)
      .order('created_at', { ascending: false })
      .limit(4),
  ])

  if (transactionsResult.error || systemResult.error || complianceResult.error || auditResult.error) {
    return fail('NOTIFICATIONS_LOAD_FAILED', 'Failed to load notifications', 500)
  }

  const notifications: NotificationItem[] = []
  const transactions = (transactionsResult.data ?? []) as Database['public']['Tables']['transactions']['Row'][]
  const systems = (systemResult.data ?? []) as Database['public']['Tables']['system_health']['Row'][]
  const complianceRecords =
    (complianceResult.data ?? []) as Database['public']['Tables']['compliance_records']['Row'][]
  const audits = (auditResult.data ?? []) as Database['public']['Tables']['audit_logs']['Row'][]

  for (const transaction of transactions) {
    const statusConfigByType = {
      pending: {
        title: 'Approval required',
        severity: 'warning' as const,
        message: `${transaction.asset_symbol} transfer worth $${transaction.amount_usd.toLocaleString()} is waiting for approval.`,
      },
      processing: {
        title: 'Transaction processing',
        severity: 'info' as const,
        message: `${transaction.asset_symbol} transfer is processing on ${transaction.blockchain}.`,
      },
      approved: {
        title: 'Transaction approved',
        severity: 'success' as const,
        message: `${transaction.asset_symbol} transaction was approved and moved forward.`,
      },
      rejected: {
        title: 'Transaction rejected',
        severity: 'critical' as const,
        message: transaction.rejection_reason ?? `${transaction.asset_symbol} transaction was rejected.`,
      },
      failed: {
        title: 'Transaction failed',
        severity: 'critical' as const,
        message: `${transaction.asset_symbol} transaction failed.`,
      },
    }
    const statusConfig =
      statusConfigByType[transaction.status as keyof typeof statusConfigByType]

    if (!statusConfig) {
      continue
    }

    notifications.push({
      id: `transaction-${transaction.id}`,
      title: statusConfig.title,
      message: statusConfig.message,
      kind: 'transaction',
      severity: statusConfig.severity,
      read: !isUnread(transaction.created_at, transaction.status === 'pending'),
      href:
        transaction.status === 'pending' || transaction.status === 'processing'
          ? '/approvals'
          : '/transactions',
      created_at: transaction.created_at,
    })
  }

  for (const system of systems) {
    notifications.push({
      id: `system-${system.id}`,
      title: 'Infrastructure alert',
      message: `${system.component} is currently ${system.status}.`,
      kind: 'system',
      severity: system.status === 'offline' ? 'critical' : 'warning',
      read: false,
      href: '/settings',
      created_at: system.updated_at,
    })
  }

  for (const record of complianceRecords) {
    notifications.push({
      id: `compliance-${record.id}`,
      title: 'Compliance review required',
      message: `${record.institution_name} is marked ${record.risk_level} risk with ${record.aml_status.replace('_', ' ')} AML status.`,
      kind: 'compliance',
      severity: record.risk_level === 'critical' ? 'critical' : 'warning',
      read: isUnread(record.created_at) ? false : true,
      href: '/compliance',
      created_at: record.created_at,
    })
  }

  for (const audit of audits) {
    notifications.push({
      id: `audit-${audit.id}`,
      title: audit.action.replace(/_/g, ' '),
      message: `${audit.resource_type} ${audit.resource_id ?? ''}`.trim(),
      kind: 'audit',
      severity: 'info',
      read: isUnread(audit.created_at),
      href: '/settings',
      created_at: audit.created_at,
    })
  }

  notifications.sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  )

  return ok(notifications.slice(0, 12))
})
