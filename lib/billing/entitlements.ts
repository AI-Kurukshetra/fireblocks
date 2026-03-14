import { createAdminClient } from '@/lib/supabase/admin'
import { fail } from '@/lib/api/response'
import { getPlanRecord, normalizePlanCatalogRecord, toEntitlements } from './plan-config'
import type { Database } from '@/types/database'
import type {
  BillingInterval,
  OnboardingStatus,
  OrganizationProfile,
  PlanCatalogRecord,
  PlanEntitlements,
  SubscriptionStatus,
  UsageSummary,
} from '@/types'

type OrganizationRow = Database['public']['Tables']['organizations']['Row']
type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row']
type UsageRow = Database['public']['Tables']['usage_counters']['Row']

export interface ResolvedOrganizationAccess {
  organization: OrganizationRow
  plan: PlanCatalogRecord
  subscription: SubscriptionRow | null
  entitlements: PlanEntitlements
  usageSummary: UsageSummary
}

function toNumber(value: number | null | undefined) {
  return typeof value === 'number' ? value : 0
}

export async function resolveOrganizationAccess(orgId: string): Promise<ResolvedOrganizationAccess | null> {
  const admin = createAdminClient()
  const [{ data: orgData }, { data: subscriptionData }, { data: planData }, { data: usageRows }] =
    await Promise.all([
      admin.from('organizations').select('*').eq('id', orgId).single(),
      admin
        .from('subscriptions')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin.from('plan_catalog').select('*').limit(100),
      admin
        .from('usage_counters')
        .select('*')
        .eq('organization_id', orgId)
        .gte('period_start', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ])

  const organization = orgData as OrganizationRow | null
  if (!organization) {
    return null
  }

  const catalogRows = ((planData ?? []) as Database['public']['Tables']['plan_catalog']['Row'][])
    .map((row) => normalizePlanCatalogRecord(row))
    .filter((row): row is PlanCatalogRecord => Boolean(row))

  const plan =
    catalogRows.find((row) => row.code === organization.plan) ??
    getPlanRecord(organization.plan)
  const subscription = (subscriptionData as SubscriptionRow | null) ?? null
  const entitlements = toEntitlements(plan, subscription?.status ?? organization.subscription_status)
  const usage = (usageRows ?? []) as UsageRow[]
  const usageIndex = new Map(usage.map((row) => [row.metric, row]))

  return {
    organization,
    plan,
    subscription,
    entitlements,
    usageSummary: {
      total_auc: toNumber(usageIndex.get('auc_usd')?.value),
      monthly_transactions: toNumber(usageIndex.get('monthly_transactions')?.value),
      api_calls_this_month: toNumber(usageIndex.get('api_calls_this_month')?.value),
      limits: {
        auc_limit_usd: plan.limits.auc_limit_usd,
        monthly_tx_limit: plan.limits.monthly_tx_limit,
        api_rate_limit_per_minute: plan.limits.api_rate_limit_per_minute,
      },
    },
  }
}

export function isSetupComplete(access: ResolvedOrganizationAccess) {
  return access.organization.onboarding_status === 'complete'
}

export function hasActiveSubscription(access: ResolvedOrganizationAccess) {
  return ['active', 'trialing', 'manual'].includes(access.subscription?.status ?? access.organization.subscription_status)
}

export function hasPlanFeature(access: ResolvedOrganizationAccess, feature: string) {
  return access.entitlements.features.includes(feature as never)
}

export function getUsageValue(access: ResolvedOrganizationAccess, metric: 'auc_usd' | 'monthly_transactions' | 'api_calls_this_month') {
  switch (metric) {
    case 'auc_usd':
      return access.usageSummary.total_auc
    case 'monthly_transactions':
      return access.usageSummary.monthly_transactions
    default:
      return access.usageSummary.api_calls_this_month
  }
}

export function getUsageLimit(access: ResolvedOrganizationAccess, metric: 'auc_usd' | 'monthly_transactions' | 'api_calls_this_month') {
  switch (metric) {
    case 'auc_usd':
      return access.entitlements.limits.auc_limit_usd
    case 'monthly_transactions':
      return access.entitlements.limits.monthly_tx_limit
    default:
      return access.entitlements.limits.api_rate_limit_per_minute
  }
}

export function buildOrganizationProfile(
  access: ResolvedOrganizationAccess,
  extra: Pick<OrganizationProfile, 'member_count' | 'vault_count' | 'total_auc'>,
): OrganizationProfile {
  return {
    ...access.organization,
    plan: access.plan.code,
    billing_interval: (access.organization.billing_interval ?? 'monthly') as BillingInterval,
    subscription_status: (access.subscription?.status ??
      access.organization.subscription_status) as SubscriptionStatus,
    onboarding_status: access.organization.onboarding_status as OnboardingStatus,
    member_count: extra.member_count,
    vault_count: extra.vault_count,
    total_auc: extra.total_auc,
    usage_summary: access.usageSummary,
    entitlements: access.entitlements,
  }
}

export function setupRequiredResponse() {
  return fail('SETUP_REQUIRED', 'Organization onboarding must be completed before accessing this resource.', 403)
}

export function subscriptionRequiredResponse() {
  return fail('SUBSCRIPTION_REQUIRED', 'An active subscription or trial is required for this resource.', 402)
}

export function featureRequiredResponse(feature: string) {
  return fail('PLAN_RESTRICTED', `Current plan does not include ${feature}.`, 403, {
    feature,
  })
}

export function usageLimitResponse(metric: string) {
  return fail('USAGE_LIMIT_REACHED', `Current plan limit reached for ${metric}.`, 403, {
    metric,
  })
}
