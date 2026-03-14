import { NextRequest } from 'next/server'
import { logAction } from '@/lib/audit/log-action'
import { fail, ok } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { withFeature } from '@/lib/auth/with-feature'
import { withRole } from '@/lib/auth/with-role'
import { withSetupComplete } from '@/lib/auth/with-setup'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

export const DELETE = withAuth<{ id: string }>(
  withSetupComplete()(withFeature('webhooks')(withRole(['admin'])(async (request: NextRequest, { session, params }) => {
    const admin = createAdminClient()
    const { data: rowData, error } = await admin
      .from('webhooks')
      .delete()
      .eq('organization_id', session.orgId)
      .eq('id', params.id)
      .select('id, name, url')
      .single()

    const data = rowData as Pick<Database['public']['Tables']['webhooks']['Row'], 'id' | 'name' | 'url'> | null

    if (error || !data) {
      return fail('WEBHOOK_DELETE_FAILED', 'Failed to delete webhook', 500)
    }

    await logAction({
      orgId: session.orgId,
      userId: session.userId,
      action: 'WEBHOOK_DELETED',
      resourceType: 'webhook',
      resourceId: data.id,
      request,
      metadata: {
        name: data.name,
        url: data.url,
      },
    })

    return ok(data)
  }))),
)
