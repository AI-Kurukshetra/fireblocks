import { NextRequest } from 'next/server'
import { fail, ok } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const GET = withAuth(async (_request: NextRequest, { session }) => {
  const admin = createAdminClient()
  const { data: transactions, error } = await admin
    .from('transactions')
    .select('asset_symbol, amount_usd, created_at')
    .eq('organization_id', session.orgId)
    .order('created_at', { ascending: false })

  if (error) {
    return fail('ANALYTICS_VOLUME_FAILED', 'Failed to load volume analytics', 500)
  }

  const summary = new Map<string, number>()

  for (const transaction of transactions ?? []) {
    summary.set(
      transaction.asset_symbol,
      (summary.get(transaction.asset_symbol) ?? 0) + transaction.amount_usd,
    )
  }

  return ok(
    Array.from(summary.entries()).map(([asset_symbol, total_usd]) => ({
      asset_symbol,
      total_usd,
    })),
  )
})
