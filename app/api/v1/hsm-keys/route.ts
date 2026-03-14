import { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { withSetupComplete } from '@/lib/auth/with-setup'
import { withFeature } from '@/lib/auth/with-feature'
import { createHsmKeySchema } from '@/lib/schemas/hsm-key'
import { createAdminClient } from '@/lib/supabase/admin'

export const GET = withAuth(
  withSetupComplete()(
    withFeature('hsm_inventory')(async (_request: NextRequest, { session }) => {
      const admin = createAdminClient()
      const { data, error } = await admin
        .from('hsm_keys')
        .select('*')
        .eq('organization_id', session.orgId)
        .order('created_at', { ascending: false })

      if (error) {
        return fail('HSM_KEYS_LOAD_FAILED', 'Failed to load HSM keys', 500)
      }

      return ok(data ?? [])
    }),
  ),
)

export const POST = withAuth(
  withSetupComplete()(
    withFeature('hsm_inventory')(async (request: NextRequest, { session }) => {
      if (session.role !== 'admin') {
        return fail('FORBIDDEN', 'Only admins can create HSM keys', 403)
      }

      const body = await request.json().catch(() => null)
      const parsed = createHsmKeySchema.safeParse(body)

      if (!parsed.success) {
        return fail('VALIDATION_ERROR', 'Invalid HSM key payload', 422, {
          issues: parsed.error.flatten(),
        })
      }

      const admin = createAdminClient()
      const { data, error } = await admin
        .from('hsm_keys')
        .insert({
          organization_id: session.orgId,
          vault_id: parsed.data.vault_id ?? null,
          provider: parsed.data.provider,
          label: parsed.data.label,
          environment: parsed.data.environment,
          status: 'active',
          key_reference: parsed.data.key_reference,
          assigned_policy: parsed.data.assigned_policy || null,
          next_rotation_due: parsed.data.next_rotation_due ?? null,
        })
        .select('*')
        .single()

      if (error || !data) {
        return fail('HSM_KEY_CREATE_FAILED', 'Failed to create HSM key', 500)
      }

      return ok(data, undefined, { status: 201 })
    }),
  ),
)
