import { NextRequest } from 'next/server'
import { logAction } from '@/lib/audit/log-action'
import { fail, ok } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { withRole } from '@/lib/auth/with-role'
import { updateComplianceSchema } from '@/lib/schemas/compliance'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

export const PATCH = withAuth<{ id: string }>(
  withRole(['admin'])(async (request: NextRequest, { session, params }) => {
    const body = await request.json().catch(() => null)
    const parsed = updateComplianceSchema.safeParse(body)

    if (!parsed.success) {
      return fail('VALIDATION_ERROR', 'Invalid compliance update payload', 422, {
        issues: parsed.error.flatten(),
      })
    }

    const admin = createAdminClient()
    const { data: rowData, error } = await admin
      .from('compliance_records')
      .update(parsed.data)
      .eq('organization_id', session.orgId)
      .eq('id', params.id)
      .select('*')
      .single()

    const data = rowData as Database['public']['Tables']['compliance_records']['Row'] | null

    if (error || !data) {
      return fail('COMPLIANCE_UPDATE_FAILED', 'Failed to update compliance record', 500)
    }

    await logAction({
      orgId: session.orgId,
      userId: session.userId,
      action: 'COMPLIANCE_RECORD_UPDATED',
      resourceType: 'compliance',
      resourceId: data.id,
      request,
      metadata: parsed.data,
    })

    return ok(data)
  }),
)
