import { NextRequest } from 'next/server'
import { logAction } from '@/lib/audit/log-action'
import { getPagination } from '@/lib/api/request'
import { fail, ok } from '@/lib/api/response'
import { createAdminClient } from '@/lib/supabase/admin'
import { createVaultSchema } from '@/lib/schemas/vault'
import { withAuth } from '@/lib/auth/with-auth'
import { withRole } from '@/lib/auth/with-role'
import type { Database } from '@/types/database'

function normalizeVault(vault: Record<string, unknown>) {
  const { vault_assets, ...rest } = vault

  return {
    ...rest,
    assets: Array.isArray(vault_assets) ? vault_assets : [],
  }
}

export const GET = withAuth(async (request: NextRequest, { session }) => {
  const admin = createAdminClient()
  const { page, limit, offset } = getPagination(new URL(request.url).searchParams)

  const { data: vaults, error } = await admin
    .from('vaults')
    .select('*, vault_assets(*)', { count: 'exact' })
    .eq('organization_id', session.orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return fail('VAULT_LIST_FAILED', 'Failed to list vaults', 500)
  }

  return ok((vaults ?? []).map((vault) => normalizeVault(vault as Record<string, unknown>)), {
    page,
    limit,
    total: vaults?.length ?? 0,
  })
})

export const POST = withAuth(
  withRole(['admin'])(async (request: NextRequest, { session }) => {
    const body = await request.json().catch(() => null)
    const parsed = createVaultSchema.safeParse(body)

    if (!parsed.success) {
      return fail('VALIDATION_ERROR', 'Invalid vault payload', 422, {
        issues: parsed.error.flatten(),
      })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('vaults')
      .insert({
        organization_id: session.orgId,
        created_by: session.userId,
        ...parsed.data,
      })
      .select('*')
      .single()

    const vault = data as Database['public']['Tables']['vaults']['Row'] | null

    if (error || !vault) {
      return fail('VAULT_CREATE_FAILED', 'Failed to create vault', 500)
    }

    await logAction({
      orgId: session.orgId,
      userId: session.userId,
      action: 'VAULT_CREATED',
      resourceType: 'vault',
      resourceId: vault.id,
      request,
      metadata: {
        name: vault.name,
        type: vault.type,
      },
    })

    return ok(
      {
        ...vault,
        assets: [],
      },
      undefined,
      { status: 201 },
    )
  }),
)
