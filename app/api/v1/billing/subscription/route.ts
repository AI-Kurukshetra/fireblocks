import { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { resolveOrganizationAccess } from '@/lib/billing/entitlements'

export const GET = withAuth(async (_request: NextRequest, { session }) => {
  const access = await resolveOrganizationAccess(session.orgId)

  if (!access) {
    return fail('BILLING_LOAD_FAILED', 'Failed to load billing subscription', 500)
  }

  return ok({
    organization: access.organization,
    plan: access.plan,
    subscription: access.subscription,
    entitlements: access.entitlements,
    usage: access.usageSummary,
  })
})
