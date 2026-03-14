import { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ApprovalStep, PendingApproval, TxStatus, UserRole } from '@/types'
import type { Database } from '@/types/database'

function buildApprovalSteps(
  transaction: Database['public']['Tables']['transactions']['Row'],
  approvals: Database['public']['Tables']['approvals']['Row'][],
  users: Database['public']['Tables']['users']['Row'][],
) {
  const userById = new Map(users.map((user) => [user.id, user]))
  const recordedApproverIds = new Set(approvals.map((approval) => approval.approver_id))
  const approvalSteps: ApprovalStep[] = approvals
    .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
    .map((approval) => {
      const user = userById.get(approval.approver_id)

      return {
        approver_id: approval.approver_id,
        approver_name: user?.name ?? 'Unknown approver',
        approver_role: (user?.role ?? 'approver') as UserRole,
        status: approval.action as ApprovalStep['status'],
        timestamp: approval.created_at,
        comment: approval.comment ?? undefined,
      }
    })

  const pendingSlots = Math.max(0, transaction.approvals_required - approvalSteps.length)
  const candidateApprovers = users.filter(
    (user) =>
      (user.role === 'admin' || user.role === 'approver') && !recordedApproverIds.has(user.id),
  )

  for (let index = 0; index < pendingSlots; index += 1) {
    const fallbackUser = candidateApprovers[index]
    approvalSteps.push({
      approver_id: fallbackUser?.id ?? `pending-${transaction.id}-${index}`,
      approver_name: fallbackUser?.name ?? 'Pending approver',
      approver_role: (fallbackUser?.role ?? 'approver') as UserRole,
      status: 'pending',
    })
  }

  return approvalSteps
}

export const GET = withAuth(async (_request: NextRequest, { session }) => {
  const admin = createAdminClient()
  const { data: transactionRows, error: transactionError } = await admin
    .from('transactions')
    .select('*')
    .eq('organization_id', session.orgId)
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: true })

  const transactions = (transactionRows ?? []) as Database['public']['Tables']['transactions']['Row'][]

  if (transactionError) {
    return fail('APPROVAL_LIST_FAILED', 'Failed to load approval queue', 500)
  }

  const transactionIds = transactions.map((transaction) => transaction.id)
  const [{ data: approvalRows, error: approvalError }, { data: userRows, error: userError }] =
    await Promise.all([
      transactionIds.length
        ? admin.from('approvals').select('*').in('transaction_id', transactionIds)
        : Promise.resolve({ data: [], error: null }),
      admin.from('users').select('*').eq('organization_id', session.orgId),
    ])

  if (approvalError || userError) {
    return fail('APPROVAL_CONTEXT_FAILED', 'Failed to load approval context', 500)
  }

  const approvalsByTransaction = new Map<string, Database['public']['Tables']['approvals']['Row'][]>() 

  for (const approval of (approvalRows ?? []) as Database['public']['Tables']['approvals']['Row'][]) {
    const current = approvalsByTransaction.get(approval.transaction_id) ?? []
    current.push(approval)
    approvalsByTransaction.set(approval.transaction_id, current)
  }

  const users = (userRows ?? []) as Database['public']['Tables']['users']['Row'][]
  const payload: PendingApproval[] = transactions.map((transaction) => ({
    id: transaction.id,
    tx_hash: transaction.tx_hash,
    asset_symbol: transaction.asset_symbol,
    amount: transaction.amount,
    amount_usd: transaction.amount_usd,
    from_vault: transaction.from_vault,
    to_address: transaction.to_address,
    to_institution: transaction.to_institution,
    status: transaction.status as TxStatus,
    initiated_by: transaction.initiated_by,
    blockchain: transaction.blockchain,
    gas_fee_usd: transaction.gas_fee_usd,
    approvals_required: transaction.approvals_required,
    approvals_received: transaction.approvals_received,
    rejection_reason: transaction.rejection_reason ?? undefined,
    created_at: transaction.created_at,
    completed_at: transaction.completed_at,
    expires_at: transaction.expires_at ?? transaction.created_at,
    approval_steps: buildApprovalSteps(
      transaction,
      approvalsByTransaction.get(transaction.id) ?? [],
      users,
    ),
  }))

  return ok(payload)
})
