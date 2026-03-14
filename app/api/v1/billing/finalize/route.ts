import { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { hasStripeEnv, retrieveCheckoutSession } from '@/lib/billing/stripe'
import { syncStripeSubscription } from '@/lib/billing/sync-subscription'
import { isPlanCode } from '@/lib/billing/plan-config'
import type { BillingInterval, PlanCode, SubscriptionStatus } from '@/types'

function normalizeSubscriptionStatus(value: string | null | undefined): SubscriptionStatus {
  if (
    value === 'active' ||
    value === 'trialing' ||
    value === 'past_due' ||
    value === 'canceled' ||
    value === 'incomplete' ||
    value === 'manual'
  ) {
    return value
  }

  return 'pending'
}

export const POST = withAuth(async (request: NextRequest, { session }) => {
  if (session.role !== 'admin') {
    return fail('FORBIDDEN', 'Only admins can finalize billing sessions', 403)
  }

  if (!hasStripeEnv()) {
    return fail('STRIPE_NOT_CONFIGURED', 'Stripe is not configured in this environment.', 500)
  }

  const body = await request.json().catch(() => null)
  const sessionId = typeof body?.session_id === 'string' ? body.session_id : null

  if (!sessionId) {
    return fail('SESSION_ID_REQUIRED', 'A Stripe checkout session id is required.', 422)
  }

  const checkoutSession = await retrieveCheckoutSession(sessionId)
  const metadata = checkoutSession.metadata ?? {}
  const organizationId = metadata.organization_id ?? session.orgId

  if (organizationId !== session.orgId) {
    return fail('FORBIDDEN', 'Checkout session does not belong to this organization.', 403)
  }

  const rawPlan = metadata.plan
  const plan: PlanCode = rawPlan && isPlanCode(rawPlan) ? rawPlan : session.organization.plan
  const expandedSubscription =
    checkoutSession.subscription && typeof checkoutSession.subscription === 'object'
      ? checkoutSession.subscription
      : null
  const billingInterval: BillingInterval =
    expandedSubscription?.items?.data?.[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly'
  const status = normalizeSubscriptionStatus(expandedSubscription?.status ?? checkoutSession.status)
  const currentPeriodStart =
    typeof expandedSubscription?.current_period_start === 'number'
      ? new Date(expandedSubscription.current_period_start * 1000).toISOString()
      : null
  const currentPeriodEnd =
    typeof expandedSubscription?.current_period_end === 'number'
      ? new Date(expandedSubscription.current_period_end * 1000).toISOString()
      : null
  const stripeSubscriptionId =
    expandedSubscription?.id ??
    (typeof checkoutSession.subscription === 'string' ? checkoutSession.subscription : null)

  if (status === 'active' || status === 'trialing') {
    await syncStripeSubscription({
      organizationId,
      plan,
      status,
      billingInterval,
      stripeCustomerId: checkoutSession.customer ?? null,
      stripeSubscriptionId,
      currentPeriodStart,
      currentPeriodEnd,
      metadata,
    })
  }

  return ok({
    completed: status === 'active' || status === 'trialing',
    status,
  })
})
