import { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { createPortalSession, hasStripeEnv } from '@/lib/billing/stripe'

export const POST = withAuth(async (_request: NextRequest, { session }) => {
  if (session.role !== 'admin') {
    return fail('FORBIDDEN', 'Only admins can access the billing portal', 403)
  }

  if (!hasStripeEnv()) {
    return fail('STRIPE_NOT_CONFIGURED', 'Stripe is not configured in this environment.', 500)
  }

  if (!session.organization.stripe_customer_id) {
    return fail('BILLING_CUSTOMER_MISSING', 'No Stripe customer is attached to this organization.', 409)
  }

  const url = await createPortalSession({
    customerId: session.organization.stripe_customer_id,
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  })

  return ok({ url })
})
