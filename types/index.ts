export type VaultType = 'hot' | 'warm' | 'cold'
export type VaultStatus = 'active' | 'locked' | 'archived'
export type TxStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'failed' | 'batched'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type UserRole = 'admin' | 'approver' | 'analyst' | 'viewer'
export type AmlStatus = 'passed' | 'under_review' | 'flagged' | 'failed'
export type KycStatus = 'pending' | 'verified' | 'rejected'
export type PlanCode = 'starter' | 'growth' | 'enterprise'
export type BillingInterval = 'monthly' | 'annual'
export type SubscriptionStatus =
  | 'pending'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'manual'
export type OnboardingStatus = 'pending_setup' | 'billing_pending' | 'complete'
export type HsmKeyStatus = 'active' | 'rotating' | 'disabled'
export type InsuranceStatus = 'active' | 'pending' | 'expired'
export type BatchStatus = 'draft' | 'pending' | 'processing' | 'approved' | 'rejected' | 'completed'

export type PlanFeatureKey =
  | 'multi_sig'
  | 'multi_chain'
  | 'transaction_approvals'
  | 'api_access'
  | 'compliance'
  | 'cold_storage'
  | 'audit_logs'
  | 'rbac'
  | 'webhooks'
  | 'advanced_analytics'
  | 'transaction_batching'
  | 'hsm_inventory'
  | 'reporting_exports'
  | 'emergency_recovery'
  | 'white_label'
  | 'insurance'
  | 'staking'
  | 'defi'

export interface VaultAsset {
  symbol: string
  blockchain: string
  amount: number
  usd_value: number
  wallet_address?: string | null
}

export interface Vault {
  id: string
  name: string
  type: VaultType
  status: VaultStatus
  balance_usd: number
  assets?: VaultAsset[]
  signatories_required: number
  total_signatories: number
  blockchain_networks: string[]
  last_activity: string
  created_at: string
}

export interface Transaction {
  id: string
  tx_hash: string | null
  asset_symbol: string
  amount: number
  amount_usd: number
  from_vault: string
  to_address: string
  to_institution: string | null
  status: TxStatus
  initiated_by: string
  blockchain: string
  gas_fee_usd: number
  approvals_required: number
  approvals_received: number
  batch_id?: string | null
  rejection_reason?: string | null
  created_at: string
  completed_at: string | null
  expires_at?: string | null
}

export interface User {
  id: string
  auth_user_id?: string | null
  name: string
  email: string
  role: UserRole
  avatar_initials: string
  organization_id: string
  two_fa_enabled: boolean
  last_login: string | null
  created_at: string
}

export interface ComplianceRecord {
  id: string
  institution_name: string
  risk_level: RiskLevel
  aml_status: AmlStatus
  kyc_status: KycStatus
  compliance_score: number
  flagged_transactions: number
  last_review: string
  next_review: string
  created_at: string
}

export interface StatCardProps {
  title: string
  value: string
  delta?: string
  deltaPositive?: boolean
  sparklineData?: number[]
  badge?: { label: string; variant: 'danger' | 'warning' | 'success' }
}

export interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export interface SystemStatus {
  component: string
  status: 'online' | 'degraded' | 'offline'
  lastChecked: string
  details?: Record<string, unknown>
}

export interface OrganizationProfile {
  id: string
  name: string
  legal_name: string | null
  slug: string
  plan: PlanCode
  subscription_status: SubscriptionStatus
  onboarding_status: OnboardingStatus
  billing_interval: BillingInterval
  billing_email: string | null
  operations_email: string | null
  compliance_email: string | null
  business_type: string | null
  registration_country: string | null
  registration_number: string | null
  tax_id: string | null
  website: string | null
  phone: string | null
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  state_region: string | null
  postal_code: string | null
  country: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  trial_ends_at: string | null
  auc_limit_usd: number | null
  monthly_tx_limit: number | null
  api_rate_limit_per_minute: number | null
  white_label_enabled: boolean
  custom_brand_name: string | null
  custom_domain: string | null
  created_at: string
  updated_at: string
  member_count: number
  vault_count: number
  total_auc: number
  usage_summary?: UsageSummary
  entitlements?: PlanEntitlements
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  kind: 'transaction' | 'system' | 'compliance' | 'audit'
  severity: 'info' | 'success' | 'warning' | 'critical'
  read: boolean
  href?: string
  created_at: string
}

export interface ChartDataPoint {
  date: string
  value: number
}

export interface AssetAllocation {
  symbol: string
  name: string
  percentage: number
  usd_value: number
  color: string
}

export interface ApprovalStep {
  approver_id: string
  approver_name: string
  approver_role: UserRole
  status: 'pending' | 'approved' | 'rejected'
  timestamp?: string
  comment?: string
}

export interface PendingApproval extends Transaction {
  approval_steps: ApprovalStep[]
  expires_at: string
}

export interface ApiKeyRecord {
  id: string
  organization_id: string
  name: string
  prefix: string
  permissions: string[]
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
  created_at: string
}

export interface WebhookRecord {
  id: string
  organization_id: string
  name: string
  url: string
  events: string[]
  status: 'active' | 'paused'
  last_test_at: string | null
  created_at: string
}

export interface AuditLogRecord {
  id: string
  organization_id: string
  user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface PlanCatalogRecord {
  code: PlanCode
  name: string
  description: string
  monthly_price_usd: number
  annual_price_usd: number
  stripe_price_monthly_id: string | null
  stripe_price_annual_id: string | null
  features: PlanFeatureKey[]
  limits: {
    auc_limit_usd: number | null
    monthly_tx_limit: number | null
    api_rate_limit_per_minute: number | null
  }
  is_active: boolean
}

export interface SubscriptionRecord {
  id: string
  organization_id: string
  plan: PlanCode
  status: SubscriptionStatus
  billing_interval: BillingInterval
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}

export interface UsageCounterRecord {
  id: string
  organization_id: string
  metric: string
  period_start: string
  period_end: string
  value: number
  limit_value: number | null
  updated_at: string
}

export interface UsageSummary {
  total_auc: number
  monthly_transactions: number
  api_calls_this_month: number
  limits: {
    auc_limit_usd: number | null
    monthly_tx_limit: number | null
    api_rate_limit_per_minute: number | null
  }
}

export interface PlanEntitlements {
  plan: PlanCode
  subscription_status: SubscriptionStatus
  features: PlanFeatureKey[]
  limits: {
    auc_limit_usd: number | null
    monthly_tx_limit: number | null
    api_rate_limit_per_minute: number | null
  }
}

export interface HsmKeyRecord {
  id: string
  organization_id: string
  vault_id: string | null
  provider: string
  label: string
  environment: string
  status: HsmKeyStatus
  key_reference: string
  assigned_policy: string | null
  last_rotated_at: string | null
  next_rotation_due: string | null
  created_at: string
}

export interface RiskProfileRecord {
  id: string
  organization_id: string
  risk_score: number
  max_single_tx_usd: number
  restricted_countries: string[]
  restricted_assets: string[]
  approval_escalation_enabled: boolean
  screening_provider: string | null
  updated_at: string
}

export interface InsurancePolicyRecord {
  id: string
  organization_id: string
  provider_name: string
  policy_number: string
  status: InsuranceStatus
  coverage_limit_usd: number
  deductible_usd: number
  covered_assets: string[]
  renewal_at: string | null
  notes: string | null
  created_at: string
}

export interface PortfolioSnapshotRecord {
  id: string
  organization_id: string
  snapshot_date: string
  total_auc_usd: number
  hot_balance_usd: number
  warm_balance_usd: number
  cold_balance_usd: number
  total_transactions_30d: number
  api_calls_30d: number
  created_at: string
}

export interface BatchTransactionRecord {
  id: string
  organization_id: string
  name: string
  asset_symbol: string
  blockchain: string
  status: BatchStatus
  total_items: number
  total_amount_usd: number
  approvals_required: number
  approvals_received: number
  created_by: string
  created_at: string
  completed_at: string | null
}

export interface ReportExportRecord {
  id: string
  organization_id: string
  type: string
  status: string
  storage_path: string | null
  requested_by: string | null
  filters: Record<string, unknown>
  created_at: string
  completed_at: string | null
}
