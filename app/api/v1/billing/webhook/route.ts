import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyStripeSignature } from '@/lib/billing/stripe'
import { syncStripeSubscription } from '@/lib/billing/sync-subscription'
import { isPlanCode } from '@/lib/billing/plan-config'
import type { Database } from '@/types/database'
import type { BillingInterval, PlanCode, SubscriptionStatus } from '@/types'

type StripeEvent = {
  id: string
  type: string
  data: {
    object: Record<string, unknown>
  }
}

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

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signatureHeader = request.headers.get('stripe-signature')

  if (!verifyStripeSignature(payload, signatureHeader)) {
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 })
  }

  const event = JSON.parse(payload) as StripeEvent
  const admin = createAdminClient()
  const object = event.data.object
  const metadata =
    object.metadata && typeof object.metadata === 'object' && !Array.isArray(object.metadata)
      ? (object.metadata as Record<string, string>)
      : {}
  const organizationId = metadata.organization_id ?? null

  await admin.from('billing_events').upsert({
    organization_id: organizationId,
    event_type: event.type,
    stripe_event_id: event.id,
    payload: event as unknown as Database['public']['Tables']['billing_events']['Insert']['payload'],
  })

  if (!organizationId) {
    return NextResponse.json({ received: true })
  }

  if (event.type === 'checkout.session.completed' || event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const status = normalizeSubscriptionStatus(typeof object.status === 'string' ? object.status : 'active')
    const stripeSubscriptionId =
      typeof object.subscription === 'string'
        ? object.subscription
        : typeof object.id === 'string'
          ? object.id
          : null
    const stripeCustomerId =
      typeof object.customer === 'string'
        ? object.customer
        : typeof object.customer_id === 'string'
          ? object.customer_id
          : null
    const plan: PlanCode = metadata.plan && isPlanCode(metadata.plan) ? metadata.plan : 'starter'
    const currentPeriodStart =
      typeof object.current_period_start === 'number'
        ? new Date(object.current_period_start * 1000).toISOString()
        : null
    const currentPeriodEnd =
      typeof object.current_period_end === 'number'
        ? new Date(object.current_period_end * 1000).toISOString()
        : null
    const billingInterval: BillingInterval =
      metadata.billing_interval === 'annual' ? 'annual' : 'monthly'

    await syncStripeSubscription({
      organizationId,
      plan,
      status,
      billingInterval,
      stripeCustomerId,
      stripeSubscriptionId,
      currentPeriodStart,
      currentPeriodEnd,
      metadata,
    })
  }

  if (event.type === 'customer.subscription.deleted') {
    await admin
      .from('organizations')
      .update({
        subscription_status: 'canceled',
      })
      .eq('id', organizationId)

    await admin
      .from('subscriptions')
      .update({
        status: 'canceled',
      })
      .eq('organization_id', organizationId)
  }

  return NextResponse.json({ received: true })
}
