import { NextRequest } from 'next/server'
import { logAction } from '@/lib/audit/log-action'
import { fail, ok } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { withFeature } from '@/lib/auth/with-feature'
import { withRole } from '@/lib/auth/with-role'
import { withSetupComplete } from '@/lib/auth/with-setup'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

export const POST = withAuth<{ id: string }>(
  withSetupComplete()(withFeature('webhooks')(withRole(['admin'])(async (request: NextRequest, { session, params }) => {
    const admin = createAdminClient()
    const now = new Date().toISOString()
    const { data: rowData, error } = await admin
      .from('webhooks')
      .update({
        last_test_at: now,
      })
      .eq('organization_id', session.orgId)
      .eq('id', params.id)
      .select('id, name, url, last_test_at')
      .single()

    const data = rowData as Pick<
      Database['public']['Tables']['webhooks']['Row'],
      'id' | 'name' | 'url' | 'last_test_at'
    > | null

    if (error || !data) {
      return fail('WEBHOOK_TEST_FAILED', 'Failed to send webhook test', 500)
    }

    await logAction({
      orgId: session.orgId,
      userId: session.userId,
      action: 'WEBHOOK_TEST_SENT',
      resourceType: 'webhook',
      resourceId: data.id,
      request,
      metadata: {
        url: data.url,
      },
    })

    return ok({
      ...data,
      status: 'queued',
    })
  }))),
)
