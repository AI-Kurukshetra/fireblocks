import { createAdminClient } from '@/lib/supabase/admin'
import type { BillingInterval, PlanCode, SubscriptionStatus } from '@/types'

interface SyncStripeSubscriptionInput {
  organizationId: string
  plan: PlanCode
  status: SubscriptionStatus
  billingInterval: BillingInterval
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  metadata?: Record<string, string>
}

export async function syncStripeSubscription(input: SyncStripeSubscriptionInput) {
  const admin = createAdminClient()

  await admin
    .from('subscriptions')
    .upsert(
      {
        organization_id: input.organizationId,
        plan: input.plan,
        status: input.status,
        billing_interval: input.billingInterval,
        stripe_customer_id: input.stripeCustomerId,
        stripe_subscription_id: input.stripeSubscriptionId,
        current_period_start: input.currentPeriodStart,
        current_period_end: input.currentPeriodEnd,
        metadata: input.metadata ?? {},
      },
      { onConflict: 'organization_id' },
    )

  await admin
    .from('organizations')
    .update({
      plan: input.plan,
      subscription_status: input.status,
      onboarding_status:
        input.status === 'active' || input.status === 'trialing' ? 'complete' : 'billing_pending',
      stripe_customer_id: input.stripeCustomerId,
      stripe_subscription_id: input.stripeSubscriptionId,
    })
    .eq('id', input.organizationId)

  if (input.status === 'active' || input.status === 'trialing') {
    const { data: owner } = await admin
      .from('users')
      .select('id')
      .eq('organization_id', input.organizationId)
      .eq('role', 'admin')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (owner?.id) {
      await admin.rpc('seed_org_demo_data', {
        target_org_id: input.organizationId,
        owner_user_id: owner.id,
      })
    }
  }
}
