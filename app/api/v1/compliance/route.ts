import { NextRequest } from 'next/server'
import { logAction } from '@/lib/audit/log-action'
import { getPagination } from '@/lib/api/request'
import { fail, ok } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { withRole } from '@/lib/auth/with-role'
import { createComplianceSchema } from '@/lib/schemas/compliance'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

export const GET = withAuth(async (request: NextRequest, { session }) => {
  const { page, limit, offset } = getPagination(new URL(request.url).searchParams)
  const admin = createAdminClient()
  const { data, error, count } = await admin
    .from('compliance_records')
    .select('*', { count: 'exact' })
    .eq('organization_id', session.orgId)
    .order('next_review', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    return fail('COMPLIANCE_LIST_FAILED', 'Failed to list compliance records', 500)
  }

  return ok(data ?? [], {
    page,
    limit,
    total: count ?? data?.length ?? 0,
  })
})

export const POST = withAuth(
  withRole(['admin'])(async (request: NextRequest, { session }) => {
    const body = await request.json().catch(() => null)
    const parsed = createComplianceSchema.safeParse(body)

    if (!parsed.success) {
      return fail('VALIDATION_ERROR', 'Invalid compliance payload', 422, {
        issues: parsed.error.flatten(),
      })
    }

    const admin = createAdminClient()
    const { data: rowData, error } = await admin
      .from('compliance_records')
      .insert({
        organization_id: session.orgId,
        ...parsed.data,
      })
      .select('*')
      .single()

    const data = rowData as Database['public']['Tables']['compliance_records']['Row'] | null

    if (error || !data) {
      return fail('COMPLIANCE_CREATE_FAILED', 'Failed to create compliance record', 500)
    }

    await logAction({
      orgId: session.orgId,
      userId: session.userId,
      action: 'COMPLIANCE_RECORD_CREATED',
      resourceType: 'compliance',
      resourceId: data.id,
      request,
      metadata: {
        institution_name: data.institution_name,
        risk_level: data.risk_level,
      },
    })

    return ok(data, undefined, { status: 201 })
  }),
)
