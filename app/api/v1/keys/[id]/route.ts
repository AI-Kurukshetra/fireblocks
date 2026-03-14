import { NextRequest } from 'next/server'
import { logAction } from '@/lib/audit/log-action'
import { fail, ok } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { withRole } from '@/lib/auth/with-role'
import { withSetupComplete } from '@/lib/auth/with-setup'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

export const DELETE = withAuth<{ id: string }>(
  withSetupComplete()(withRole(['admin'])(async (request: NextRequest, { session, params }) => {
    const admin = createAdminClient()
    const { data: rowData, error } = await admin
      .from('api_keys')
      .update({
        revoked_at: new Date().toISOString(),
      })
      .eq('organization_id', session.orgId)
      .eq('id', params.id)
      .select('id, prefix')
      .single()

    const data = rowData as Pick<Database['public']['Tables']['api_keys']['Row'], 'id' | 'prefix'> | null

    if (error || !data) {
      return fail('KEY_REVOKE_FAILED', 'Failed to revoke API key', 500)
    }

    await logAction({
      orgId: session.orgId,
      userId: session.userId,
      action: 'API_KEY_REVOKED',
      resourceType: 'api_key',
      resourceId: data.id,
      request,
      metadata: {
        prefix: data.prefix,
      },
    })

    return ok(data)
  })),
)
