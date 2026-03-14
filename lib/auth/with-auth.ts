import { type NextRequest } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { fail } from '@/lib/api/response'
import { ensureUserProfile } from '@/lib/auth/ensure-profile'
import { resolveOrganizationAccess } from '@/lib/billing/entitlements'
import type { UserRole } from '@/types'
import type { OrganizationProfile, PlanEntitlements, SubscriptionRecord, UsageSummary } from '@/types'

export interface AuthContext {
  userId: string
  authUserId: string
  orgId: string
  role: UserRole
  email: string
  name: string
  organization: Pick<
    OrganizationProfile,
    | 'id'
    | 'name'
    | 'slug'
    | 'plan'
    | 'subscription_status'
    | 'onboarding_status'
    | 'billing_interval'
    | 'stripe_customer_id'
    | 'stripe_subscription_id'
  >
  subscription: SubscriptionRecord | null
  entitlements: PlanEntitlements
  usage: UsageSummary
}

type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>
}

type Handler<TParams extends Record<string, string> = Record<string, never>> = (
  req: NextRequest,
  ctx: { session: AuthContext; params: TParams },
) => Promise<Response>

export function withAuth<TParams extends Record<string, string> = Record<string, never>>(
  handler: Handler<TParams>,
) {
  return async (request: NextRequest, context: RouteContext<TParams>) => {
    const supabase = await createServerSupabase()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return fail('UNAUTHORIZED', 'Authentication required', 401)
    }

    const profile = await ensureUserProfile(user)

    if (!profile) {
      return fail('FORBIDDEN', 'User not found in organization', 403)
    }

    if (profile.locked_until && new Date(profile.locked_until) > new Date()) {
      return fail('ACCOUNT_LOCKED', 'Account temporarily locked', 423)
    }

    const access = await resolveOrganizationAccess(profile.organization_id)

    if (!access) {
      return fail('ORGANIZATION_NOT_FOUND', 'Organization state is unavailable', 403)
    }

    return handler(request, {
      session: {
        userId: profile.id,
        authUserId: user.id,
        orgId: profile.organization_id,
        role: profile.role as UserRole,
        email: profile.email,
        name: profile.name,
        organization: {
          id: access.organization.id,
          name: access.organization.name,
          slug: access.organization.slug,
          plan: access.organization.plan as OrganizationProfile['plan'],
          subscription_status:
            access.organization.subscription_status as OrganizationProfile['subscription_status'],
          onboarding_status:
            access.organization.onboarding_status as OrganizationProfile['onboarding_status'],
          billing_interval:
            access.organization.billing_interval as OrganizationProfile['billing_interval'],
          stripe_customer_id: access.organization.stripe_customer_id,
          stripe_subscription_id: access.organization.stripe_subscription_id,
        },
        subscription: access.subscription
          ? {
              ...access.subscription,
              plan: access.subscription.plan as SubscriptionRecord['plan'],
              status: access.subscription.status as SubscriptionRecord['status'],
              billing_interval:
                access.subscription.billing_interval as SubscriptionRecord['billing_interval'],
            }
          : null,
        entitlements: access.entitlements,
        usage: access.usageSummary,
      },
      params: await context.params,
    })
  }
}
