import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { logAction } from '@/lib/audit/log-action'
import { fail, ok } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { withFeature } from '@/lib/auth/with-feature'
import { withRole } from '@/lib/auth/with-role'
import { withSetupComplete } from '@/lib/auth/with-setup'
import { createWebhookSchema } from '@/lib/schemas/webhook'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

export const GET = withAuth(
  withSetupComplete()(withFeature('webhooks')(withRole(['admin'])(async (_request: NextRequest, { session }) => {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('webhooks')
      .select('id, organization_id, name, url, events, status, last_test_at, created_at')
      .eq('organization_id', session.orgId)
      .order('created_at', { ascending: false })

    if (error) {
      return fail('WEBHOOK_LIST_FAILED', 'Failed to list webhooks', 500)
    }

    return ok(data ?? [])
  }))),
)

export const POST = withAuth(
  withSetupComplete()(withFeature('webhooks')(withRole(['admin'])(async (request: NextRequest, { session }) => {
    const body = await request.json().catch(() => null)
    const parsed = createWebhookSchema.safeParse(body)

    if (!parsed.success) {
      return fail('VALIDATION_ERROR', 'Invalid webhook payload', 422, {
        issues: parsed.error.flatten(),
      })
    }

    const admin = createAdminClient()
    const { data: rowData, error } = await admin
      .from('webhooks')
      .insert({
        organization_id: session.orgId,
        name: parsed.data.name,
        url: parsed.data.url,
        events: parsed.data.events,
        signing_secret_hash: createHash('sha256')
          .update(`${parsed.data.name}:${parsed.data.url}:${Date.now()}`)
          .digest('hex'),
      })
      .select('id, organization_id, name, url, events, status, last_test_at, created_at')
      .single()

    const data = rowData as Omit<Database['public']['Tables']['webhooks']['Row'], 'signing_secret_hash'> | null

    if (error || !data) {
      return fail('WEBHOOK_CREATE_FAILED', 'Failed to create webhook', 500)
    }

    await logAction({
      orgId: session.orgId,
      userId: session.userId,
      action: 'WEBHOOK_CREATED',
      resourceType: 'webhook',
      resourceId: data.id,
      request,
      metadata: {
        url: data.url,
        events: data.events,
      },
    })

    return ok(data, undefined, { status: 201 })
  }))),
)
