import { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { withSetupComplete } from '@/lib/auth/with-setup'
import { riskProfileSchema } from '@/lib/schemas/risk-profile'
import { createAdminClient } from '@/lib/supabase/admin'

export const GET = withAuth(
  withSetupComplete()(async (_request: NextRequest, { session }) => {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('risk_profiles')
      .select('*')
      .eq('organization_id', session.orgId)
      .maybeSingle()

    if (error) {
      return fail('RISK_PROFILE_LOAD_FAILED', 'Failed to load risk profile', 500)
    }

    return ok(data)
  }),
)

export const PUT = withAuth(
  withSetupComplete()(async (request: NextRequest, { session }) => {
    if (session.role !== 'admin') {
      return fail('FORBIDDEN', 'Only admins can update the risk profile', 403)
    }

    const body = await request.json().catch(() => null)
    const parsed = riskProfileSchema.safeParse(body)

    if (!parsed.success) {
      return fail('VALIDATION_ERROR', 'Invalid risk profile payload', 422, {
        issues: parsed.error.flatten(),
      })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('risk_profiles')
      .upsert(
        {
          organization_id: session.orgId,
          ...parsed.data,
          screening_provider: parsed.data.screening_provider || null,
        },
        { onConflict: 'organization_id' },
      )
      .select('*')
      .single()

    if (error || !data) {
      return fail('RISK_PROFILE_UPDATE_FAILED', 'Failed to update risk profile', 500)
    }

    return ok(data)
  }),
)
