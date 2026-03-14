import { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createCheckoutSession, createOrUpdateStripeCustomer, hasStripeEnv } from '@/lib/billing/stripe'
import { getPlanRecord, isPlanCode } from '@/lib/billing/plan-config'
import type { BillingInterval } from '@/types'

export const POST = withAuth(async (request: NextRequest, { session }) => {
  if (session.role !== 'admin') {
    return fail('FORBIDDEN', 'Only admins can manage billing checkout', 403)
  }

  if (!hasStripeEnv()) {
    return fail('STRIPE_NOT_CONFIGURED', 'Stripe is not configured in this environment.', 500)
  }

  const body = await request.json().catch(() => ({}))
  const planCode = typeof body.plan === 'string' && isPlanCode(body.plan) ? body.plan : session.organization.plan
  const billingInterval =
    body.billing_interval === 'annual' || body.billing_interval === 'monthly'
      ? (body.billing_interval as BillingInterval)
      : session.organization.billing_interval

  const plan = getPlanRecord(planCode)
  const admin = createAdminClient()
  const customerId = await createOrUpdateStripeCustomer({
    existingCustomerId: session.organization.stripe_customer_id,
    email: session.email,
    name: session.organization.name,
    organizationId: session.orgId,
  })

  await admin
    .from('organizations')
    .update({
      plan: plan.code,
      billing_interval: billingInterval,
      stripe_customer_id: customerId,
      onboarding_status:
        session.organization.onboarding_status === 'complete'
          ? 'complete'
          : 'billing_pending',
    })
    .eq('id', session.orgId)

  const redirectUrl = await createCheckoutSession({
    customerId,
    plan,
    billingInterval,
    organizationId: session.orgId,
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings?billing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings?billing=cancelled`,
  })

  return ok({ url: redirectUrl })
})
