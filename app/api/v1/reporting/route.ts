import { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { withSetupComplete } from '@/lib/auth/with-setup'
import { withFeature } from '@/lib/auth/with-feature'
import { createAdminClient } from '@/lib/supabase/admin'

export const GET = withAuth(
  withSetupComplete()(
    withFeature('reporting_exports')(async (_request: NextRequest, { session }) => {
      const admin = createAdminClient()
      const { data, error } = await admin
        .from('report_exports')
        .select('*')
        .eq('organization_id', session.orgId)
        .order('created_at', { ascending: false })

      if (error) {
        return fail('REPORT_LOAD_FAILED', 'Failed to load report exports', 500)
      }

      return ok(data ?? [])
    }),
  ),
)

export const POST = withAuth(
  withSetupComplete()(
    withFeature('reporting_exports')(async (request: NextRequest, { session }) => {
      const body = await request.json().catch(() => ({}))
      const admin = createAdminClient()
      const { data, error } = await admin
        .from('report_exports')
        .insert({
          organization_id: session.orgId,
          type: typeof body.type === 'string' ? body.type : 'custom-export',
          status: 'ready',
          storage_path: `/reports/${session.orgId}/${Date.now()}.json`,
          requested_by: session.userId,
          filters:
            body.filters && typeof body.filters === 'object' && !Array.isArray(body.filters)
              ? body.filters
              : {},
          completed_at: new Date().toISOString(),
        })
        .select('*')
        .single()

      if (error || !data) {
        return fail('REPORT_CREATE_FAILED', 'Failed to create report export', 500)
      }

      return ok(data, undefined, { status: 201 })
    }),
  ),
)
