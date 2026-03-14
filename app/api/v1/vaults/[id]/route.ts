import { NextRequest } from 'next/server'
import { logAction } from '@/lib/audit/log-action'
import { fail, ok } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { withRole } from '@/lib/auth/with-role'
import { updateVaultSchema } from '@/lib/schemas/vault'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

function normalizeVault(vault: Record<string, unknown>) {
  const { vault_assets, ...rest } = vault

  return {
    ...rest,
    assets: Array.isArray(vault_assets) ? vault_assets : [],
  }
}

async function getVaultForOrg(orgId: string, id: string) {
  const admin = createAdminClient()

  return admin
    .from('vaults')
    .select('*, vault_assets(*)')
    .eq('organization_id', orgId)
    .eq('id', id)
    .single()
}

export const GET = withAuth<{ id: string }>(async (_request: NextRequest, { session, params }) => {
  const { data: vault, error } = await getVaultForOrg(session.orgId, params.id)

  if (error || !vault) {
    return fail('VAULT_NOT_FOUND', 'Vault not found', 404)
  }

  return ok(normalizeVault(vault as Record<string, unknown>))
})

export const PATCH = withAuth<{ id: string }>(
  withRole(['admin'])(async (request: NextRequest, { session, params }) => {
    const body = await request.json().catch(() => null)
    const parsed = updateVaultSchema.safeParse(body)

    if (!parsed.success) {
      return fail('VALIDATION_ERROR', 'Invalid vault update payload', 422, {
        issues: parsed.error.flatten(),
      })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('vaults')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', session.orgId)
      .eq('id', params.id)
      .select('*, vault_assets(*)')
      .single()

    const vault = data as (Database['public']['Tables']['vaults']['Row'] & {
      vault_assets?: unknown[]
    }) | null

    if (error || !vault) {
      return fail('VAULT_UPDATE_FAILED', 'Failed to update vault', 500)
    }

    await logAction({
      orgId: session.orgId,
      userId: session.userId,
      action: 'VAULT_UPDATED',
      resourceType: 'vault',
      resourceId: vault.id,
      request,
      metadata: parsed.data,
    })

    return ok(normalizeVault(vault as Record<string, unknown>))
  }),
)

export const DELETE = withAuth<{ id: string }>(
  withRole(['admin'])(async (request: NextRequest, { session, params }) => {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('vaults')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', session.orgId)
      .eq('id', params.id)
      .select('*')
      .single()

    const vault = data as Database['public']['Tables']['vaults']['Row'] | null

    if (error || !vault) {
      return fail('VAULT_ARCHIVE_FAILED', 'Failed to archive vault', 500)
    }

    await logAction({
      orgId: session.orgId,
      userId: session.userId,
      action: 'VAULT_ARCHIVED',
      resourceType: 'vault',
      resourceId: vault.id,
      request,
    })

    return ok({
      ...vault,
      assets: [],
    })
  }),
)
