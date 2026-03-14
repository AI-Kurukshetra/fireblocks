import type {
  BillingInterval,
  PlanCatalogRecord,
  PlanCode,
  PlanEntitlements,
  PlanFeatureKey,
} from '@/types'

export const DEFAULT_PLAN_CATALOG: Record<PlanCode, PlanCatalogRecord> = {
  starter: {
    code: 'starter',
    name: 'Starter',
    description: 'Security-first custody operating layer for smaller institutional teams.',
    monthly_price_usd: 999,
    annual_price_usd: 9990,
    stripe_price_monthly_id: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? null,
    stripe_price_annual_id: process.env.STRIPE_PRICE_STARTER_ANNUAL ?? null,
    features: [
      'multi_sig',
      'multi_chain',
      'transaction_approvals',
      'api_access',
      'compliance',
      'cold_storage',
      'audit_logs',
      'rbac',
    ],
    limits: {
      auc_limit_usd: 25_000_000,
      monthly_tx_limit: 250,
      api_rate_limit_per_minute: 120,
    },
    is_active: true,
  },
  growth: {
    code: 'growth',
    name: 'Growth',
    description: 'Higher-scale operating plan with batching, webhooks, and reporting exports.',
    monthly_price_usd: 2999,
    annual_price_usd: 29990,
    stripe_price_monthly_id: process.env.STRIPE_PRICE_GROWTH_MONTHLY ?? null,
    stripe_price_annual_id: process.env.STRIPE_PRICE_GROWTH_ANNUAL ?? null,
    features: [
      'multi_sig',
      'multi_chain',
      'transaction_approvals',
      'api_access',
      'compliance',
      'cold_storage',
      'audit_logs',
      'rbac',
      'webhooks',
      'advanced_analytics',
      'transaction_batching',
      'hsm_inventory',
      'reporting_exports',
      'emergency_recovery',
    ],
    limits: {
      auc_limit_usd: 150_000_000,
      monthly_tx_limit: 2_500,
      api_rate_limit_per_minute: 400,
    },
    is_active: true,
  },
  enterprise: {
    code: 'enterprise',
    name: 'Enterprise',
    description: 'Full institutional operating package with white-label and modeled premium controls.',
    monthly_price_usd: 7999,
    annual_price_usd: 79990,
    stripe_price_monthly_id: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? null,
    stripe_price_annual_id: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL ?? null,
    features: [
      'multi_sig',
      'multi_chain',
      'transaction_approvals',
      'api_access',
      'compliance',
      'cold_storage',
      'audit_logs',
      'rbac',
      'webhooks',
      'advanced_analytics',
      'transaction_batching',
      'hsm_inventory',
      'reporting_exports',
      'emergency_recovery',
      'white_label',
      'insurance',
      'staking',
      'defi',
    ],
    limits: {
      auc_limit_usd: 750_000_000,
      monthly_tx_limit: 15_000,
      api_rate_limit_per_minute: 1_200,
    },
    is_active: true,
  },
}

export function isPlanCode(value: string): value is PlanCode {
  return value === 'starter' || value === 'growth' || value === 'enterprise'
}

export function normalizePlanCatalogRecord(raw: {
  code: string
  name: string
  description: string
  monthly_price_usd: number
  annual_price_usd: number
  stripe_price_monthly_id: string | null
  stripe_price_annual_id: string | null
  features: unknown
  limits: unknown
  is_active: boolean
}): PlanCatalogRecord | null {
  if (!isPlanCode(raw.code)) {
    return null
  }

  const features = Array.isArray(raw.features)
    ? raw.features.filter((value): value is PlanFeatureKey => typeof value === 'string')
    : DEFAULT_PLAN_CATALOG[raw.code].features

  const rawLimits =
    raw.limits && typeof raw.limits === 'object' && !Array.isArray(raw.limits)
      ? (raw.limits as Record<string, unknown>)
      : {}

  return {
    code: raw.code,
    name: raw.name,
    description: raw.description,
    monthly_price_usd: raw.monthly_price_usd,
    annual_price_usd: raw.annual_price_usd,
    stripe_price_monthly_id: raw.stripe_price_monthly_id,
    stripe_price_annual_id: raw.stripe_price_annual_id,
    features,
    limits: {
      auc_limit_usd:
        typeof rawLimits.auc_limit_usd === 'number'
          ? rawLimits.auc_limit_usd
          : DEFAULT_PLAN_CATALOG[raw.code].limits.auc_limit_usd,
      monthly_tx_limit:
        typeof rawLimits.monthly_tx_limit === 'number'
          ? rawLimits.monthly_tx_limit
          : DEFAULT_PLAN_CATALOG[raw.code].limits.monthly_tx_limit,
      api_rate_limit_per_minute:
        typeof rawLimits.api_rate_limit_per_minute === 'number'
          ? rawLimits.api_rate_limit_per_minute
          : DEFAULT_PLAN_CATALOG[raw.code].limits.api_rate_limit_per_minute,
    },
    is_active: raw.is_active,
  }
}

export function getPlanRecord(plan: string): PlanCatalogRecord {
  return DEFAULT_PLAN_CATALOG[isPlanCode(plan) ? plan : 'starter']
}

export function getPlanPriceId(
  plan: PlanCatalogRecord,
  interval: BillingInterval,
) {
  return interval === 'annual'
    ? plan.stripe_price_annual_id
    : plan.stripe_price_monthly_id
}

export function toEntitlements(plan: PlanCatalogRecord, subscriptionStatus: string): PlanEntitlements {
  return {
    plan: plan.code,
    subscription_status:
      subscriptionStatus === 'active' ||
      subscriptionStatus === 'trialing' ||
      subscriptionStatus === 'past_due' ||
      subscriptionStatus === 'canceled' ||
      subscriptionStatus === 'incomplete' ||
      subscriptionStatus === 'manual'
        ? subscriptionStatus
        : 'pending',
    features: plan.features,
    limits: plan.limits,
  }
}
