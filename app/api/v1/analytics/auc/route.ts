import { NextRequest } from 'next/server'
import { fail, ok } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const GET = withAuth(async (_request: NextRequest, { session }) => {
  const admin = createAdminClient()
  const { data: vaults, error } = await admin
    .from('vaults')
    .select('balance_usd, created_at')
    .eq('organization_id', session.orgId)
    .order('created_at', { ascending: true })

  if (error) {
    return fail('ANALYTICS_AUC_FAILED', 'Failed to load AUC analytics', 500)
  }

  let running = 0
  const series = (vaults ?? []).map((vault) => {
    running += vault.balance_usd
    return {
      date: vault.created_at,
      value: running,
    }
  })

  return ok(series)
})
