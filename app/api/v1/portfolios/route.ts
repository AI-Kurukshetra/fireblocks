import { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { withSetupComplete } from '@/lib/auth/with-setup'
import { withFeature } from '@/lib/auth/with-feature'
import { createAdminClient } from '@/lib/supabase/admin'

export const GET = withAuth(
  withSetupComplete()(
    withFeature('advanced_analytics')(async (_request: NextRequest, { session }) => {
      const admin = createAdminClient()
      const { data, error } = await admin
        .from('portfolio_snapshots')
        .select('*')
        .eq('organization_id', session.orgId)
        .order('snapshot_date', { ascending: false })

      if (error) {
        return fail('PORTFOLIO_LOAD_FAILED', 'Failed to load portfolio snapshots', 500)
      }

      return ok(data ?? [])
    }),
  ),
)
