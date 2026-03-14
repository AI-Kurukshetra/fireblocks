import { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { resolveOrganizationAccess } from '@/lib/billing/entitlements'

export const GET = withAuth(async (_request: NextRequest, { session }) => {
  const access = await resolveOrganizationAccess(session.orgId)

  if (!access) {
    return fail('USAGE_LOAD_FAILED', 'Failed to load usage', 500)
  }

  return ok(access.usageSummary)
})
