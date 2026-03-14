import { NextRequest } from 'next/server'
import { logAction } from '@/lib/audit/log-action'
import { ok, fail } from '@/lib/api/response'
import { resolveOrganizationAccess } from '@/lib/billing/entitlements'
import { getPlanRecord } from '@/lib/billing/plan-config'
import { createCheckoutSession, createOrUpdateStripeCustomer, hasStripeEnv } from '@/lib/billing/stripe'
import { withAuth } from '@/lib/auth/with-auth'
import { organizationSetupSchema } from '@/lib/schemas/organization'
import { createAdminClient } from '@/lib/supabase/admin'

export const GET = withAuth(async (_request: NextRequest, { session }) => {
  const access = await resolveOrganizationAccess(session.orgId)

  if (!access) {
    return fail('ORGANIZATION_NOT_FOUND', 'Organization not found', 404)
  }

  return ok({
    organization: access.organization,
    entitlements: access.entitlements,
    usage: access.usageSummary,
    requires_setup: access.organization.onboarding_status !== 'complete',
  })
})

export const POST = withAuth(async (request: NextRequest, { session }) => {
  if (session.role !== 'admin') {
    return fail('FORBIDDEN', 'Only organization admins can complete setup', 403)
  }

  const body = await request.json().catch(() => null)
  const parsed = organizationSetupSchema.safeParse(body)

  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid setup payload', 422, {
      issues: parsed.error.flatten(),
    })
  }

  const admin = createAdminClient()
  const plan = getPlanRecord(parsed.data.plan)
  const limits = plan.limits
  const updatePayload = {
    name: parsed.data.organization_name,
    legal_name: parsed.data.legal_name,
    business_type: parsed.data.business_type,
    registration_country: parsed.data.registration_country,
    registration_number: parsed.data.registration_number,
    tax_id: parsed.data.tax_id,
    website: parsed.data.website,
    phone: parsed.data.phone,
    billing_email: parsed.data.billing_email,
    operations_email: parsed.data.operations_email,
    compliance_email: parsed.data.compliance_email,
    address_line_1: parsed.data.address_line_1,
    address_line_2: parsed.data.address_line_2 || null,
    city: parsed.data.city,
    state_region: parsed.data.state_region,
    postal_code: parsed.data.postal_code,
    country: parsed.data.country,
    plan: parsed.data.plan,
    billing_interval: parsed.data.billing_interval,
    auc_limit_usd: limits.auc_limit_usd,
    monthly_tx_limit: limits.monthly_tx_limit,
    api_rate_limit_per_minute: limits.api_rate_limit_per_minute,
    subscription_status: hasStripeEnv() ? 'pending' : 'manual',
    onboarding_status: hasStripeEnv() ? 'billing_pending' : 'complete',
    updated_at: new Date().toISOString(),
  }

  const { data: orgData, error } = await admin
    .from('organizations')
    .update(updatePayload)
    .eq('id', session.orgId)
    .select('*')
    .single()

  if (error || !orgData) {
    return fail('SETUP_UPDATE_FAILED', 'Failed to save organization setup', 500)
  }

  let redirectUrl: string | null = null

  if (hasStripeEnv()) {
    const customerId = await createOrUpdateStripeCustomer({
      existingCustomerId: orgData.stripe_customer_id,
      email: parsed.data.billing_email,
      name: parsed.data.organization_name,
      organizationId: session.orgId,
    })

    await admin
      .from('organizations')
      .update({
        stripe_customer_id: customerId,
      })
      .eq('id', session.orgId)

    await admin
      .from('subscriptions')
      .upsert(
        {
          organization_id: session.orgId,
          plan: parsed.data.plan,
          status: 'pending',
          billing_interval: parsed.data.billing_interval,
          stripe_customer_id: customerId,
          trial_ends_at: orgData.trial_ends_at,
          metadata: {
            source: 'setup',
          },
        },
        { onConflict: 'organization_id' },
      )

    redirectUrl = await createCheckoutSession({
      customerId,
      plan,
      billingInterval: parsed.data.billing_interval,
      organizationId: session.orgId,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/setup?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/setup?checkout=cancelled`,
    })
  } else {
    await admin
      .from('subscriptions')
      .upsert(
        {
          organization_id: session.orgId,
          plan: parsed.data.plan,
          status: 'manual',
          billing_interval: parsed.data.billing_interval,
          trial_ends_at: orgData.trial_ends_at,
          metadata: {
            source: 'manual-dev',
          },
        },
        { onConflict: 'organization_id' },
      )

    await admin.rpc('seed_org_demo_data', {
      target_org_id: session.orgId,
      owner_user_id: session.userId,
    })
  }

  await logAction({
    orgId: session.orgId,
    userId: session.userId,
    action: 'ORG_SETUP_SUBMITTED',
    resourceType: 'organization',
    resourceId: session.orgId,
    request,
    metadata: {
      plan: parsed.data.plan,
      billing_interval: parsed.data.billing_interval,
      stripe_redirect: Boolean(redirectUrl),
    },
  })

  return ok({
    organization: orgData,
    redirect_url: redirectUrl,
    completed: !redirectUrl,
  })
})
