import { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { withSetupComplete } from '@/lib/auth/with-setup'
import { withFeature } from '@/lib/auth/with-feature'
import { insurancePolicySchema } from '@/lib/schemas/insurance'
import { createAdminClient } from '@/lib/supabase/admin'

export const GET = withAuth(
  withSetupComplete()(
    withFeature('insurance')(async (_request: NextRequest, { session }) => {
      const admin = createAdminClient()
      const { data, error } = await admin
        .from('insurance_policies')
        .select('*')
        .eq('organization_id', session.orgId)
        .order('created_at', { ascending: false })

      if (error) {
        return fail('INSURANCE_LOAD_FAILED', 'Failed to load insurance policies', 500)
      }

      return ok(data ?? [])
    }),
  ),
)

export const POST = withAuth(
  withSetupComplete()(
    withFeature('insurance')(async (request: NextRequest, { session }) => {
      if (session.role !== 'admin') {
        return fail('FORBIDDEN', 'Only admins can create insurance policies', 403)
      }

      const body = await request.json().catch(() => null)
      const parsed = insurancePolicySchema.safeParse(body)

      if (!parsed.success) {
        return fail('VALIDATION_ERROR', 'Invalid insurance payload', 422, {
          issues: parsed.error.flatten(),
        })
      }

      const admin = createAdminClient()
      const { data, error } = await admin
        .from('insurance_policies')
        .insert({
          organization_id: session.orgId,
          ...parsed.data,
          renewal_at: parsed.data.renewal_at ?? null,
          notes: parsed.data.notes || null,
        })
        .select('*')
        .single()

      if (error || !data) {
        return fail('INSURANCE_CREATE_FAILED', 'Failed to create insurance policy', 500)
      }

      return ok(data, undefined, { status: 201 })
    }),
  ),
)
