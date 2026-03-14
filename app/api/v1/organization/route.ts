import { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { withSetupComplete } from '@/lib/auth/with-setup'
import { createAdminClient } from '@/lib/supabase/admin'
import { organizationUpdateSchema } from '@/lib/schemas/organization'
import { buildOrganizationProfile, resolveOrganizationAccess } from '@/lib/billing/entitlements'

export const GET = withAuth(async (_request: NextRequest, { session }) => {
  const admin = createAdminClient()
  const access = await resolveOrganizationAccess(session.orgId)

  if (!access) {
    return fail('ORGANIZATION_LOAD_FAILED', 'Failed to load organization profile', 500)
  }

  const [{ count: memberCount, error: memberError }, { data: vaultRows, error: vaultError }] =
    await Promise.all([
      admin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', session.orgId),
      admin
        .from('vaults')
        .select('balance_usd')
        .eq('organization_id', session.orgId),
    ])

  if (memberError || vaultError) {
    return fail('ORGANIZATION_LOAD_FAILED', 'Failed to load organization profile', 500)
  }

  const totalAuc = (vaultRows ?? []).reduce((sum, vault) => sum + vault.balance_usd, 0)

  return ok(
    buildOrganizationProfile(access, {
      member_count: memberCount ?? 0,
      vault_count: vaultRows?.length ?? 0,
      total_auc: totalAuc,
    }),
  )
})

export const PATCH = withAuth(
  withSetupComplete()(async (request: NextRequest, { session }) => {
    if (session.role !== 'admin') {
      return fail('FORBIDDEN', 'Only admins can update organization settings', 403)
    }

    const body = await request.json().catch(() => null)
    const parsed = organizationUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return fail('VALIDATION_ERROR', 'Invalid organization payload', 422, {
        issues: parsed.error.flatten(),
      })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('organizations')
      .update({
        ...parsed.data,
        address_line_2: parsed.data.address_line_2 || null,
      })
      .eq('id', session.orgId)
      .select('*')
      .single()

    if (error || !data) {
      return fail('ORGANIZATION_UPDATE_FAILED', 'Failed to update organization settings', 500)
    }

    return ok(data)
  }),
)
