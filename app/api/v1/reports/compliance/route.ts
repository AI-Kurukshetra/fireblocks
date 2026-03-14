import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/with-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createSimplePdf } from '@/lib/reports/simple-pdf'

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export const GET = withAuth(async (request: NextRequest, { session }) => {
  const searchParams = new URL(request.url).searchParams
  const report = searchParams.get('report') ?? 'compliance-summary'
  const format = searchParams.get('format') ?? 'pdf'
  const admin = createAdminClient()

  const [{ data: records }, { data: organization }, { data: transactions }] = await Promise.all([
    admin
      .from('compliance_records')
      .select('*')
      .eq('organization_id', session.orgId)
      .order('next_review', { ascending: true }),
    admin.from('organizations').select('*').eq('id', session.orgId).single(),
    admin
      .from('transactions')
      .select('status, amount_usd, created_at')
      .eq('organization_id', session.orgId)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const complianceRecords = records ?? []
  const flaggedTransactions = complianceRecords.reduce(
    (sum, record) => sum + record.flagged_transactions,
    0,
  )
  const avgScore = complianceRecords.length
    ? Math.round(
        complianceRecords.reduce((sum, record) => sum + record.compliance_score, 0) /
          complianceRecords.length,
      )
    : 0
  const highRiskCount = complianceRecords.filter(
    (record) => record.risk_level === 'high' || record.risk_level === 'critical',
  ).length
  const pendingApprovals = (transactions ?? []).filter((tx) => tx.status === 'pending').length

  const title = `${organization?.name ?? 'Fireblocks'} ${report.replace(/-/g, ' ')}`
  const lines = [
    `Generated: ${new Date().toISOString()}`,
    `Organization: ${organization?.name ?? 'Unknown'}`,
    `Institutions monitored: ${complianceRecords.length}`,
    `Average compliance score: ${avgScore}/100`,
    `High risk institutions: ${highRiskCount}`,
    `Flagged transactions: ${flaggedTransactions}`,
    `Pending approvals: ${pendingApprovals}`,
    '',
    'Institution snapshot:',
    ...complianceRecords.slice(0, 10).map(
      (record) =>
        `${record.institution_name} | risk ${record.risk_level} | AML ${record.aml_status} | KYC ${record.kyc_status} | score ${record.compliance_score}`,
    ),
  ]

  const filename = `${slugify(report)}-${new Date().toISOString().slice(0, 10)}.${format}`

  if (format === 'csv') {
    const csvRows = [
      ['institution_name', 'risk_level', 'aml_status', 'kyc_status', 'compliance_score', 'flagged_transactions', 'next_review'].join(','),
      ...complianceRecords.map((record) =>
        [
          record.institution_name,
          record.risk_level,
          record.aml_status,
          record.kyc_status,
          record.compliance_score,
          record.flagged_transactions,
          record.next_review,
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n')

    return new NextResponse(csvRows, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  const pdf = createSimplePdf(title, lines)

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
})
