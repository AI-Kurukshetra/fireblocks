import { NextRequest } from 'next/server'
import { logAction } from '@/lib/audit/log-action'
import { fail, ok } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { withRole } from '@/lib/auth/with-role'
import { withSetupComplete } from '@/lib/auth/with-setup'
import { createApiKeySchema } from '@/lib/schemas/api-key'
import { generateApiKey } from '@/lib/security/api-key'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

export const GET = withAuth(
  withSetupComplete()(withRole(['admin'])(async (_request: NextRequest, { session }) => {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('api_keys')
      .select('id, organization_id, name, prefix, permissions, last_used_at, expires_at, revoked_at, created_at')
      .eq('organization_id', session.orgId)
      .order('created_at', { ascending: false })

    if (error) {
      return fail('KEY_LIST_FAILED', 'Failed to list API keys', 500)
    }

    return ok(data ?? [])
  })),
)

export const POST = withAuth(
  withSetupComplete()(withRole(['admin'])(async (request: NextRequest, { session }) => {
    const body = await request.json().catch(() => null)
    const parsed = createApiKeySchema.safeParse(body)

    if (!parsed.success) {
      return fail('VALIDATION_ERROR', 'Invalid API key payload', 422, {
        issues: parsed.error.flatten(),
      })
    }

    const { plaintext, hash, prefix } = generateApiKey()
    const admin = createAdminClient()
    const { data: rowData, error } = await admin
      .from('api_keys')
      .insert({
        organization_id: session.orgId,
        name: parsed.data.name,
        prefix,
        key_hash: hash,
        permissions: parsed.data.permissions,
        expires_at: parsed.data.expires_at ?? null,
      })
      .select('id, organization_id, name, prefix, permissions, last_used_at, expires_at, revoked_at, created_at')
      .single()

    const data = rowData as Omit<Database['public']['Tables']['api_keys']['Row'], 'key_hash'> | null

    if (error || !data) {
      return fail('KEY_CREATE_FAILED', 'Failed to create API key', 500)
    }

    await logAction({
      orgId: session.orgId,
      userId: session.userId,
      action: 'API_KEY_CREATED',
      resourceType: 'api_key',
      resourceId: data.id,
      request,
      metadata: {
        prefix: data.prefix,
        permissions: data.permissions,
      },
    })

    return ok(
      {
        ...data,
        plaintext,
      },
      undefined,
      { status: 201 },
    )
  })),
)
