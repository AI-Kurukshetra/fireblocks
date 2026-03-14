create extension if not exists pgcrypto;

create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input, 'fireblocks')), '[^a-z0-9]+', '-', 'g'))
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  slug text not null unique,
  plan text not null default 'starter',
  subscription_status text not null default 'pending',
  onboarding_status text not null default 'pending_setup',
  billing_interval text not null default 'monthly',
  billing_email text,
  operations_email text,
  compliance_email text,
  business_type text,
  registration_country text,
  registration_number text,
  tax_id text,
  website text,
  phone text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state_region text,
  postal_code text,
  country text,
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz,
  auc_limit_usd numeric(20,2),
  monthly_tx_limit integer,
  api_rate_limit_per_minute integer,
  white_label_enabled boolean not null default false,
  custom_brand_name text,
  custom_domain text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations add column if not exists legal_name text;
alter table public.organizations add column if not exists subscription_status text not null default 'pending';
alter table public.organizations add column if not exists onboarding_status text not null default 'pending_setup';
alter table public.organizations add column if not exists billing_interval text not null default 'monthly';
alter table public.organizations add column if not exists billing_email text;
alter table public.organizations add column if not exists operations_email text;
alter table public.organizations add column if not exists compliance_email text;
alter table public.organizations add column if not exists business_type text;
alter table public.organizations add column if not exists registration_country text;
alter table public.organizations add column if not exists registration_number text;
alter table public.organizations add column if not exists tax_id text;
alter table public.organizations add column if not exists website text;
alter table public.organizations add column if not exists phone text;
alter table public.organizations add column if not exists address_line_1 text;
alter table public.organizations add column if not exists address_line_2 text;
alter table public.organizations add column if not exists city text;
alter table public.organizations add column if not exists state_region text;
alter table public.organizations add column if not exists postal_code text;
alter table public.organizations add column if not exists country text;
alter table public.organizations add column if not exists stripe_customer_id text;
alter table public.organizations add column if not exists stripe_subscription_id text;
alter table public.organizations add column if not exists trial_ends_at timestamptz;
alter table public.organizations add column if not exists auc_limit_usd numeric(20,2);
alter table public.organizations add column if not exists monthly_tx_limit integer;
alter table public.organizations add column if not exists api_rate_limit_per_minute integer;
alter table public.organizations add column if not exists white_label_enabled boolean not null default false;
alter table public.organizations add column if not exists custom_brand_name text;
alter table public.organizations add column if not exists custom_domain text;

create table if not exists public.plan_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  monthly_price_usd numeric(12,2) not null default 0,
  annual_price_usd numeric(12,2) not null default 0,
  stripe_price_monthly_id text,
  stripe_price_annual_id text,
  features jsonb not null default '[]'::jsonb,
  limits jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  plan text not null default 'starter',
  status text not null default 'pending',
  billing_interval text not null default 'monthly',
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  trial_ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_org_idx on public.subscriptions (organization_id, created_at desc);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  event_type text not null,
  stripe_event_id text not null unique,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  metric text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  value numeric(20,2) not null default 0,
  limit_value numeric(20,2),
  updated_at timestamptz not null default now(),
  unique (organization_id, metric, period_start)
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('admin', 'approver', 'analyst', 'viewer')),
  avatar_initials text not null,
  two_fa_enabled boolean not null default false,
  failed_login_count integer not null default 0,
  locked_until timestamptz,
  last_login timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.vaults (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  type text not null check (type in ('hot', 'warm', 'cold')),
  status text not null default 'active' check (status in ('active', 'locked', 'archived')),
  balance_usd numeric(20,2) not null default 0,
  signatories_required integer not null check (signatories_required >= 1),
  total_signatories integer not null check (total_signatories >= signatories_required),
  blockchain_networks text[] not null default '{}',
  last_activity timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null
);

create table if not exists public.vault_assets (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.vaults(id) on delete cascade,
  symbol text not null,
  blockchain text not null,
  amount numeric(30,8) not null default 0,
  usd_value numeric(20,2) not null default 0,
  wallet_address text,
  updated_at timestamptz not null default now()
);

create unique index if not exists vault_assets_vault_symbol_idx
  on public.vault_assets (vault_id, symbol);

create table if not exists public.approval_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  asset_symbol text,
  min_amount_usd numeric(20,2),
  max_amount_usd numeric(20,2),
  approvals_required integer not null default 2,
  approver_roles text[] not null default array['admin','approver']::text[],
  time_limit_minutes integer not null default 1440,
  created_at timestamptz not null default now()
);

create table if not exists public.batch_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  asset_symbol text not null,
  blockchain text not null,
  status text not null default 'pending' check (status in ('draft','pending','processing','approved','rejected','completed')),
  total_items integer not null default 0,
  total_amount_usd numeric(20,2) not null default 0,
  approvals_required integer not null default 2,
  approvals_received integer not null default 0,
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tx_hash text,
  asset_symbol text not null,
  amount numeric(30,8) not null,
  amount_usd numeric(20,2) not null,
  from_vault uuid not null references public.vaults(id) on delete restrict,
  to_address text not null,
  to_institution text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'approved', 'rejected', 'failed', 'batched')),
  initiated_by uuid not null references public.users(id) on delete restrict,
  blockchain text not null,
  gas_fee_usd numeric(12,4) not null default 0,
  approvals_required integer not null default 2,
  approvals_received integer not null default 0,
  batch_id uuid references public.batch_transactions(id) on delete set null,
  rejection_reason text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz
);

alter table public.transactions add column if not exists batch_id uuid references public.batch_transactions(id) on delete set null;

create index if not exists transactions_org_created_idx
  on public.transactions (organization_id, created_at desc);

create table if not exists public.batch_transaction_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batch_transactions(id) on delete cascade,
  to_address text not null,
  to_institution text,
  amount numeric(30,8) not null,
  amount_usd numeric(20,2) not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  approver_id uuid not null references public.users(id) on delete cascade,
  action text not null check (action in ('approved', 'rejected')),
  comment text,
  created_at timestamptz not null default now(),
  unique (transaction_id, approver_id)
);

create table if not exists public.compliance_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  institution_name text not null,
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  aml_status text not null check (aml_status in ('passed', 'under_review', 'flagged', 'failed')),
  kyc_status text not null check (kyc_status in ('pending', 'verified', 'rejected')),
  compliance_score integer not null check (compliance_score between 0 and 100),
  flagged_transactions integer not null default 0,
  last_review timestamptz not null,
  next_review timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.risk_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  risk_score integer not null default 72,
  max_single_tx_usd numeric(20,2) not null default 1000000,
  restricted_countries text[] not null default '{}',
  restricted_assets text[] not null default '{}',
  approval_escalation_enabled boolean not null default true,
  screening_provider text,
  updated_at timestamptz not null default now()
);

create table if not exists public.insurance_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider_name text not null,
  policy_number text not null,
  status text not null default 'active' check (status in ('active', 'pending', 'expired')),
  coverage_limit_usd numeric(20,2) not null default 0,
  deductible_usd numeric(20,2) not null default 0,
  covered_assets text[] not null default '{}',
  renewal_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.hsm_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vault_id uuid references public.vaults(id) on delete set null,
  provider text not null,
  label text not null,
  environment text not null default 'production',
  status text not null default 'active' check (status in ('active', 'rotating', 'disabled')),
  key_reference text not null,
  assigned_policy text,
  last_rotated_at timestamptz,
  next_rotation_due timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_date timestamptz not null,
  total_auc_usd numeric(20,2) not null default 0,
  hot_balance_usd numeric(20,2) not null default 0,
  warm_balance_usd numeric(20,2) not null default 0,
  cold_balance_usd numeric(20,2) not null default 0,
  total_transactions_30d integer not null default 0,
  api_calls_30d integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type text not null,
  status text not null default 'ready',
  storage_path text,
  requested_by uuid references public.users(id) on delete set null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_org_created_idx
  on public.audit_logs (organization_id, created_at desc);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  prefix text not null,
  key_hash text not null,
  permissions text[] not null default array['read']::text[],
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.webhooks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  url text not null,
  events text[] not null default '{}'::text[],
  signing_secret_hash text not null,
  status text not null default 'active' check (status in ('active', 'paused')),
  last_test_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.system_health (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  component text not null,
  status text not null check (status in ('online', 'degraded', 'offline')),
  details jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (organization_id, component)
);

create table if not exists public.analytics_kpi_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_date timestamptz not null,
  auc_usd numeric(20,2) not null default 0,
  transaction_volume_usd numeric(20,2) not null default 0,
  transaction_count integer not null default 0,
  approval_time_minutes numeric(12,2) not null default 0,
  uptime_percentage numeric(6,3) not null default 99.95,
  api_success_rate numeric(6,3) not null default 99.50,
  compliance_pass_rate numeric(6,3) not null default 98.00,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text not null,
  use_case text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.users
  where auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.users
  where auth_user_id = auth.uid()
  limit 1
$$;

alter table public.organizations enable row level security;
alter table public.plan_catalog enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_events enable row level security;
alter table public.usage_counters enable row level security;
alter table public.users enable row level security;
alter table public.vaults enable row level security;
alter table public.vault_assets enable row level security;
alter table public.approval_policies enable row level security;
alter table public.batch_transactions enable row level security;
alter table public.batch_transaction_items enable row level security;
alter table public.transactions enable row level security;
alter table public.approvals enable row level security;
alter table public.compliance_records enable row level security;
alter table public.risk_profiles enable row level security;
alter table public.insurance_policies enable row level security;
alter table public.hsm_keys enable row level security;
alter table public.portfolio_snapshots enable row level security;
alter table public.report_exports enable row level security;
alter table public.audit_logs enable row level security;
alter table public.api_keys enable row level security;
alter table public.webhooks enable row level security;
alter table public.system_health enable row level security;
alter table public.analytics_kpi_snapshots enable row level security;
alter table public.contact_requests enable row level security;

drop policy if exists plan_catalog_select_all on public.plan_catalog;
create policy plan_catalog_select_all on public.plan_catalog
  for select using (true);

drop policy if exists organizations_select_self on public.organizations;
create policy organizations_select_self on public.organizations
  for select using (id = public.current_org_id());

drop policy if exists organizations_update_admin on public.organizations;
create policy organizations_update_admin on public.organizations
  for update using (id = public.current_org_id() and public.current_role() = 'admin')
  with check (id = public.current_org_id() and public.current_role() = 'admin');

drop policy if exists users_select_self_org on public.users;
create policy users_select_self_org on public.users
  for select using (organization_id = public.current_org_id());

drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

drop policy if exists subscriptions_select_org on public.subscriptions;
create policy subscriptions_select_org on public.subscriptions
  for select using (organization_id = public.current_org_id());

drop policy if exists usage_counters_select_org on public.usage_counters;
create policy usage_counters_select_org on public.usage_counters
  for select using (organization_id = public.current_org_id());

drop policy if exists org_scoped_vaults on public.vaults;
create policy org_scoped_vaults on public.vaults
  for all using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

drop policy if exists org_scoped_vault_assets on public.vault_assets;
create policy org_scoped_vault_assets on public.vault_assets
  for all
  using (
    exists (
      select 1 from public.vaults
      where public.vaults.id = public.vault_assets.vault_id
        and public.vaults.organization_id = public.current_org_id()
    )
  )
  with check (
    exists (
      select 1 from public.vaults
      where public.vaults.id = public.vault_assets.vault_id
        and public.vaults.organization_id = public.current_org_id()
    )
  );

drop policy if exists org_scoped_approval_policies on public.approval_policies;
create policy org_scoped_approval_policies on public.approval_policies
  for all using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

drop policy if exists org_scoped_batch_transactions on public.batch_transactions;
create policy org_scoped_batch_transactions on public.batch_transactions
  for all using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

drop policy if exists org_scoped_batch_items on public.batch_transaction_items;
create policy org_scoped_batch_items on public.batch_transaction_items
  for all
  using (
    exists (
      select 1 from public.batch_transactions
      where public.batch_transactions.id = public.batch_transaction_items.batch_id
        and public.batch_transactions.organization_id = public.current_org_id()
    )
  )
  with check (
    exists (
      select 1 from public.batch_transactions
      where public.batch_transactions.id = public.batch_transaction_items.batch_id
        and public.batch_transactions.organization_id = public.current_org_id()
    )
  );

drop policy if exists org_scoped_transactions on public.transactions;
create policy org_scoped_transactions on public.transactions
  for all using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

drop policy if exists org_scoped_approvals on public.approvals;
create policy org_scoped_approvals on public.approvals
  for all
  using (
    exists (
      select 1 from public.transactions
      where public.transactions.id = public.approvals.transaction_id
        and public.transactions.organization_id = public.current_org_id()
    )
  )
  with check (
    exists (
      select 1 from public.transactions
      where public.transactions.id = public.approvals.transaction_id
        and public.transactions.organization_id = public.current_org_id()
    )
  );

drop policy if exists org_scoped_compliance on public.compliance_records;
create policy org_scoped_compliance on public.compliance_records
  for all using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

drop policy if exists org_scoped_risk on public.risk_profiles;
create policy org_scoped_risk on public.risk_profiles
  for all using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

drop policy if exists org_scoped_insurance on public.insurance_policies;
create policy org_scoped_insurance on public.insurance_policies
  for all using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

drop policy if exists org_scoped_hsm_keys on public.hsm_keys;
create policy org_scoped_hsm_keys on public.hsm_keys
  for all using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

drop policy if exists org_scoped_portfolios on public.portfolio_snapshots;
create policy org_scoped_portfolios on public.portfolio_snapshots
  for select using (organization_id = public.current_org_id());

drop policy if exists org_scoped_reports on public.report_exports;
create policy org_scoped_reports on public.report_exports
  for all using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

drop policy if exists audit_select_admin on public.audit_logs;
create policy audit_select_admin on public.audit_logs
  for select using (
    organization_id = public.current_org_id()
    and public.current_role() in ('admin', 'approver')
  );

drop policy if exists api_keys_admin_only on public.api_keys;
create policy api_keys_admin_only on public.api_keys
  for all using (
    organization_id = public.current_org_id()
    and public.current_role() = 'admin'
  )
  with check (
    organization_id = public.current_org_id()
    and public.current_role() = 'admin'
  );

drop policy if exists webhooks_admin_only on public.webhooks;
create policy webhooks_admin_only on public.webhooks
  for all using (
    organization_id = public.current_org_id()
    and public.current_role() = 'admin'
  )
  with check (
    organization_id = public.current_org_id()
    and public.current_role() = 'admin'
  );

drop policy if exists system_health_select_org on public.system_health;
create policy system_health_select_org on public.system_health
  for select using (organization_id = public.current_org_id());

drop policy if exists analytics_kpi_select_org on public.analytics_kpi_snapshots;
create policy analytics_kpi_select_org on public.analytics_kpi_snapshots
  for select using (organization_id = public.current_org_id());

insert into public.plan_catalog (
  code,
  name,
  description,
  monthly_price_usd,
  annual_price_usd,
  stripe_price_monthly_id,
  stripe_price_annual_id,
  features,
  limits
) values
  (
    'starter',
    'Starter',
    'Security-first custody operating layer for smaller institutional teams.',
    999,
    9990,
    null,
    null,
    '["multi_sig","multi_chain","transaction_approvals","api_access","compliance","cold_storage","audit_logs","rbac"]'::jsonb,
    '{"auc_limit_usd":25000000,"monthly_tx_limit":250,"api_rate_limit_per_minute":120}'::jsonb
  ),
  (
    'growth',
    'Growth',
    'Higher-scale operating plan with batching, webhooks, and reporting exports.',
    2999,
    29990,
    null,
    null,
    '["multi_sig","multi_chain","transaction_approvals","api_access","compliance","cold_storage","audit_logs","rbac","webhooks","advanced_analytics","transaction_batching","hsm_inventory","reporting_exports","emergency_recovery"]'::jsonb,
    '{"auc_limit_usd":150000000,"monthly_tx_limit":2500,"api_rate_limit_per_minute":400}'::jsonb
  ),
  (
    'enterprise',
    'Enterprise',
    'Full institutional operating package with white-label and modeled premium controls.',
    7999,
    79990,
    null,
    null,
    '["multi_sig","multi_chain","transaction_approvals","api_access","compliance","cold_storage","audit_logs","rbac","webhooks","advanced_analytics","transaction_batching","hsm_inventory","reporting_exports","emergency_recovery","white_label","insurance","staking","defi"]'::jsonb,
    '{"auc_limit_usd":750000000,"monthly_tx_limit":15000,"api_rate_limit_per_minute":1200}'::jsonb
  )
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  monthly_price_usd = excluded.monthly_price_usd,
  annual_price_usd = excluded.annual_price_usd,
  features = excluded.features,
  limits = excluded.limits,
  updated_at = now();

create or replace function public.seed_org_demo_data(
  target_org_id uuid,
  owner_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cold_vault uuid;
  hot_vault uuid;
  warm_vault uuid;
  tx_one uuid;
  batch_one uuid;
  owner_email text;
  owner_name text;
  org_plan text;
  plan_limits jsonb;
begin
  if exists (select 1 from public.vaults where organization_id = target_org_id limit 1) then
    return;
  end if;

  select email, name into owner_email, owner_name from public.users where id = owner_user_id;
  select plan into org_plan from public.organizations where id = target_org_id;
  select limits into plan_limits from public.plan_catalog where code = org_plan;

  insert into public.users (organization_id, name, email, role, avatar_initials, two_fa_enabled, last_login)
  values
    (target_org_id, 'Marcus Williams', 'm.williams+' || substring(target_org_id::text, 1, 6) || '@fireblocks.app', 'approver', 'MW', true, now() - interval '3 hours'),
    (target_org_id, 'Priya Sharma', 'p.sharma+' || substring(target_org_id::text, 1, 6) || '@fireblocks.app', 'analyst', 'PS', true, now() - interval '7 hours'),
    (target_org_id, 'Joel Okafor', 'j.okafor+' || substring(target_org_id::text, 1, 6) || '@fireblocks.app', 'approver', 'JO', false, now() - interval '1 day');

  insert into public.approval_policies (
    organization_id, name, asset_symbol, min_amount_usd, max_amount_usd, approvals_required, approver_roles, time_limit_minutes
  ) values
    (target_org_id, 'Default Treasury Policy', 'USDC', 10000, 5000000, 2, array['admin','approver']::text[], 1440),
    (target_org_id, 'Cold Vault Escalation', 'BTC', 500000, 10000000, 3, array['admin','approver']::text[], 720);

  insert into public.vaults (
    organization_id, name, type, status, balance_usd, signatories_required, total_signatories, blockchain_networks, last_activity, created_by
  ) values
    (target_org_id, 'Primary Cold Storage', 'cold', 'active', 182500000, 3, 5, array['bitcoin','ethereum'], now() - interval '2 hours', owner_user_id),
    (target_org_id, 'Treasury Warm Vault', 'warm', 'active', 45250000, 2, 4, array['ethereum','polygon'], now() - interval '35 minutes', owner_user_id),
    (target_org_id, 'Trading Hot Wallet', 'hot', 'active', 9250000, 2, 3, array['ethereum','solana'], now() - interval '9 minutes', owner_user_id)
  returning id into cold_vault;

  select id into cold_vault from public.vaults where organization_id = target_org_id and name = 'Primary Cold Storage';
  select id into warm_vault from public.vaults where organization_id = target_org_id and name = 'Treasury Warm Vault';
  select id into hot_vault from public.vaults where organization_id = target_org_id and name = 'Trading Hot Wallet';

  insert into public.vault_assets (vault_id, symbol, blockchain, amount, usd_value, wallet_address)
  values
    (cold_vault, 'BTC', 'bitcoin', 875.42, 102500000, 'bc1q-prod-cold-' || substring(target_org_id::text, 1, 8)),
    (cold_vault, 'ETH', 'ethereum', 18840.22, 80000000, '0xCold' || substring(target_org_id::text, 1, 10)),
    (warm_vault, 'USDC', 'ethereum', 30250000, 30250000, '0xWarm' || substring(target_org_id::text, 1, 10)),
    (warm_vault, 'MATIC', 'polygon', 1500000, 1250000, '0xPoly' || substring(target_org_id::text, 1, 10)),
    (hot_vault, 'SOL', 'solana', 45800, 6150000, 'SoHot' || substring(target_org_id::text, 1, 8)),
    (hot_vault, 'ETH', 'ethereum', 850.75, 3100000, '0xHot' || substring(target_org_id::text, 1, 10));

  insert into public.batch_transactions (
    organization_id, name, asset_symbol, blockchain, status, total_items, total_amount_usd, approvals_required, approvals_received, created_by, created_at
  ) values
    (target_org_id, 'March Treasury Sweep', 'USDC', 'ethereum', 'pending', 3, 750000, 2, 1, owner_user_id, now() - interval '90 minutes')
  returning id into batch_one;

  insert into public.batch_transaction_items (batch_id, to_address, to_institution, amount, amount_usd, status)
  values
    (batch_one, '0xFeedA11ce000000000000000000000000000001', 'Prime Settlement', 150000, 150000, 'pending'),
    (batch_one, '0xFeedA11ce000000000000000000000000000002', 'Prime Settlement', 250000, 250000, 'pending'),
    (batch_one, '0xFeedA11ce000000000000000000000000000003', 'Prime Settlement', 350000, 350000, 'pending');

  insert into public.transactions (
    organization_id, tx_hash, asset_symbol, amount, amount_usd, from_vault, to_address, to_institution, status,
    initiated_by, blockchain, gas_fee_usd, approvals_required, approvals_received, expires_at, created_at, batch_id
  ) values
    (target_org_id, '0x' || encode(gen_random_bytes(32), 'hex'), 'USDC', 500000, 500000, warm_vault, '0xA11ce0000000000000000000000000000000001', 'Anchorage Settlement', 'pending', owner_user_id, 'ethereum', 14.22, 2, 1, now() + interval '18 hours', now() - interval '45 minutes', null),
    (target_org_id, '0x' || encode(gen_random_bytes(32), 'hex'), 'ETH', 150.75, 526000, hot_vault, '0xA11ce0000000000000000000000000000000002', 'Counterparty A', 'approved', owner_user_id, 'ethereum', 9.87, 2, 2, now() + interval '8 hours', now() - interval '6 hours', null),
    (target_org_id, '0x' || encode(gen_random_bytes(32), 'hex'), 'BTC', 2.25, 145000, cold_vault, 'bc1qsettlement0000000000000000000000001', 'Prime Broker', 'processing', owner_user_id, 'bitcoin', 18.11, 3, 2, now() + interval '10 hours', now() - interval '2 hours', null),
    (target_org_id, null, 'USDC', 750000, 750000, warm_vault, 'BATCHED', 'March Treasury Sweep', 'batched', owner_user_id, 'ethereum', 0, 2, 1, now() + interval '12 hours', now() - interval '80 minutes', batch_one)
  returning id into tx_one;

  insert into public.approvals (transaction_id, approver_id, action, comment)
  select t.id, u.id, 'approved', 'Policy checks passed'
  from public.transactions t
  cross join lateral (
    select id from public.users
    where organization_id = target_org_id and role = 'approver'
    order by created_at asc
    limit 1
  ) u
  where t.organization_id = target_org_id and t.status in ('pending','approved')
  limit 2
  on conflict do nothing;

  insert into public.compliance_records (
    organization_id, institution_name, risk_level, aml_status, kyc_status, compliance_score,
    flagged_transactions, last_review, next_review
  ) values
    (target_org_id, 'Anchorage Settlement', 'low', 'passed', 'verified', 96, 0, now() - interval '4 days', now() + interval '26 days'),
    (target_org_id, 'Prime Broker', 'medium', 'under_review', 'verified', 82, 1, now() - interval '2 days', now() + interval '14 days'),
    (target_org_id, 'Counterparty A', 'high', 'flagged', 'pending', 61, 3, now() - interval '10 hours', now() + interval '7 days');

  insert into public.risk_profiles (
    organization_id, risk_score, max_single_tx_usd, restricted_countries, restricted_assets, approval_escalation_enabled, screening_provider
  ) values
    (target_org_id, 78, 2500000, array['KP','IR']::text[], array['XMR']::text[], true, 'Chainalysis')
  on conflict (organization_id) do update
  set
    risk_score = excluded.risk_score,
    max_single_tx_usd = excluded.max_single_tx_usd,
    restricted_countries = excluded.restricted_countries,
    restricted_assets = excluded.restricted_assets,
    approval_escalation_enabled = excluded.approval_escalation_enabled,
    screening_provider = excluded.screening_provider,
    updated_at = now();

  insert into public.insurance_policies (
    organization_id, provider_name, policy_number, status, coverage_limit_usd, deductible_usd, covered_assets, renewal_at, notes
  ) values
    (target_org_id, 'Institutional Shield Underwriters', 'FB-' || substring(target_org_id::text, 1, 8), case when org_plan = 'enterprise' then 'active' else 'pending' end, 50000000, 250000, array['BTC','ETH','USDC']::text[], now() + interval '11 months', 'Modeled policy coverage for enterprise operations');

  insert into public.hsm_keys (
    organization_id, vault_id, provider, label, environment, status, key_reference, assigned_policy, last_rotated_at, next_rotation_due
  ) values
    (target_org_id, cold_vault, 'AWS CloudHSM', 'Primary BTC Signer', 'production', 'active', 'hsm-ref-' || substring(target_org_id::text, 1, 8) || '-1', 'Cold Vault Escalation', now() - interval '45 days', now() + interval '45 days'),
    (target_org_id, warm_vault, 'Azure Managed HSM', 'Treasury ETH Signer', 'production', 'active', 'hsm-ref-' || substring(target_org_id::text, 1, 8) || '-2', 'Default Treasury Policy', now() - interval '30 days', now() + interval '60 days');

  insert into public.portfolio_snapshots (
    organization_id, snapshot_date, total_auc_usd, hot_balance_usd, warm_balance_usd, cold_balance_usd, total_transactions_30d, api_calls_30d
  ) values
    (target_org_id, now() - interval '30 days', 211500000, 7550000, 38250000, 165700000, 92, 4200),
    (target_org_id, now(), 237000000, 9250000, 45250000, 182500000, 143, 6180);

  insert into public.report_exports (
    organization_id, type, status, storage_path, requested_by, filters, created_at, completed_at
  ) values
    (target_org_id, 'compliance-pdf', 'ready', '/reports/' || target_org_id::text || '/compliance-march.pdf', owner_user_id, '{"range":"30d"}'::jsonb, now() - interval '3 days', now() - interval '3 days'),
    (target_org_id, 'operations-csv', 'ready', '/reports/' || target_org_id::text || '/operations-march.csv', owner_user_id, '{"range":"30d"}'::jsonb, now() - interval '1 day', now() - interval '1 day');

  insert into public.system_health (organization_id, component, status, details)
  values
    (target_org_id, 'HSM Cluster', 'online', '{"provider":"multi-cloud"}'::jsonb),
    (target_org_id, 'Policy Engine', 'online', '{"rules":24}'::jsonb),
    (target_org_id, 'Webhook Delivery', case when org_plan = 'starter' then 'degraded' else 'online' end, '{"backlog":2}'::jsonb),
    (target_org_id, 'Compliance Screening', 'online', '{"provider":"Chainalysis"}'::jsonb)
  on conflict (organization_id, component) do update
  set status = excluded.status, details = excluded.details, updated_at = now();

  insert into public.analytics_kpi_snapshots (
    organization_id, snapshot_date, auc_usd, transaction_volume_usd, transaction_count, approval_time_minutes, uptime_percentage, api_success_rate, compliance_pass_rate
  ) values
    (target_org_id, now() - interval '30 days', 211500000, 16300000, 92, 7.6, 99.94, 99.42, 97.10),
    (target_org_id, now(), 237000000, 28450000, 143, 5.1, 99.97, 99.63, 98.40);

  insert into public.usage_counters (organization_id, metric, period_start, period_end, value, limit_value)
  values
    (target_org_id, 'monthly_transactions', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 143, coalesce((plan_limits ->> 'monthly_tx_limit')::numeric, null)),
    (target_org_id, 'api_calls_this_month', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 6180, coalesce((plan_limits ->> 'api_rate_limit_per_minute')::numeric, null)),
    (target_org_id, 'auc_usd', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month', 237000000, coalesce((plan_limits ->> 'auc_limit_usd')::numeric, null))
  on conflict (organization_id, metric, period_start) do update
  set value = excluded.value, limit_value = excluded.limit_value, updated_at = now();

  insert into public.subscriptions (
    organization_id, plan, status, billing_interval, stripe_customer_id, stripe_subscription_id,
    current_period_start, current_period_end, trial_ends_at, metadata
  ) values (
    target_org_id,
    org_plan,
    case when org_plan = 'starter' then 'trialing' else 'active' end,
    'monthly',
    'cus_demo_' || substring(target_org_id::text, 1, 12),
    'sub_demo_' || substring(target_org_id::text, 1, 12),
    now() - interval '5 days',
    now() + interval '25 days',
    now() + interval '9 days',
    jsonb_build_object('seeded', true)
  )
  on conflict (stripe_subscription_id) do nothing;

  update public.organizations
  set
    subscription_status = case when org_plan = 'starter' then 'trialing' else 'active' end,
    trial_ends_at = now() + interval '9 days',
    stripe_customer_id = coalesce(stripe_customer_id, 'cus_demo_' || substring(target_org_id::text, 1, 12)),
    stripe_subscription_id = coalesce(stripe_subscription_id, 'sub_demo_' || substring(target_org_id::text, 1, 12)),
    auc_limit_usd = coalesce(auc_limit_usd, (plan_limits ->> 'auc_limit_usd')::numeric),
    monthly_tx_limit = coalesce(monthly_tx_limit, (plan_limits ->> 'monthly_tx_limit')::integer),
    api_rate_limit_per_minute = coalesce(api_rate_limit_per_minute, (plan_limits ->> 'api_rate_limit_per_minute')::integer),
    updated_at = now()
  where id = target_org_id;

  insert into public.audit_logs (
    organization_id, user_id, action, resource_type, resource_id, ip_address, user_agent, metadata
  ) values
    (target_org_id, owner_user_id, 'ORG_SETUP_COMPLETED', 'organization', target_org_id::text, '127.0.0.1', 'seed-script', jsonb_build_object('owner_email', owner_email)),
    (target_org_id, owner_user_id, 'SUBSCRIPTION_SYNCED', 'subscription', target_org_id::text, '127.0.0.1', 'seed-script', jsonb_build_object('plan', org_plan)),
    (target_org_id, owner_user_id, 'BATCH_CREATED', 'batch', batch_one::text, '127.0.0.1', 'seed-script', jsonb_build_object('items', 3));
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_name text;
  org_id uuid;
  full_name text;
begin
  full_name := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'Fireblocks User');
  org_name := coalesce(new.raw_user_meta_data ->> 'organization_name', initcap(split_part(new.email, '@', 1)) || ' Capital');

  insert into public.organizations (
    name,
    legal_name,
    slug,
    plan,
    subscription_status,
    onboarding_status,
    trial_ends_at
  )
  values (
    org_name,
    org_name,
    public.slugify(org_name) || '-' || substring(new.id::text, 1, 8),
    'starter',
    'pending',
    'pending_setup',
    now() + interval '14 days'
  )
  returning id into org_id;

  insert into public.users (
    auth_user_id,
    organization_id,
    name,
    email,
    role,
    avatar_initials,
    two_fa_enabled,
    last_login
  )
  values (
    new.id,
    org_id,
    full_name,
    new.email,
    'admin',
    upper(left(split_part(full_name, ' ', 1), 1) || left(coalesce(split_part(full_name, ' ', 2), split_part(full_name, ' ', 1)), 1)),
    false,
    now()
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();
