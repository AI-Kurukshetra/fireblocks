import { NextRequest } from 'next/server'
import { getPagination } from '@/lib/api/request'
import { fail, ok } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { withRole } from '@/lib/auth/with-role'
import { createAdminClient } from '@/lib/supabase/admin'

export const GET = withAuth(
  withRole(['admin', 'approver'])(async (request: NextRequest, { session }) => {
    const { page, limit, offset } = getPagination(new URL(request.url).searchParams)
    const admin = createAdminClient()
    const { data, error, count } = await admin
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('organization_id', session.orgId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return fail('AUDIT_LIST_FAILED', 'Failed to list audit logs', 500)
    }

    return ok(data ?? [], {
      page,
      limit,
      total: count ?? data?.length ?? 0,
    })
  }),
)
