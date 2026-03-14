import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/types/database'

interface LogActionInput {
  orgId: string
  userId?: string | null
  action: string
  resourceType: string
  resourceId?: string | null
  request?: NextRequest | Request
  metadata?: Record<string, unknown>
}

export async function logAction(input: LogActionInput) {
  const admin = createAdminClient()
  const headers = input.request?.headers

  await admin.from('audit_logs').insert({
    organization_id: input.orgId,
    user_id: input.userId ?? null,
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId ?? null,
    ip_address:
      headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      headers?.get('x-real-ip') ??
      null,
    user_agent: headers?.get('user-agent') ?? null,
    metadata: (input.metadata ?? {}) as Json,
  })
}
