export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          legal_name: string | null
          slug: string
          plan: string
          subscription_status: string
          onboarding_status: string
          billing_interval: string
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
        }
        Insert: {
          id?: string
          name: string
          legal_name?: string | null
          slug: string
          plan?: string
          subscription_status?: string
          onboarding_status?: string
          billing_interval?: string
          billing_email?: string | null
          operations_email?: string | null
          compliance_email?: string | null
          business_type?: string | null
          registration_country?: string | null
          registration_number?: string | null
          tax_id?: string | null
          website?: string | null
          phone?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          state_region?: string | null
          postal_code?: string | null
          country?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          auc_limit_usd?: number | null
          monthly_tx_limit?: number | null
          api_rate_limit_per_minute?: number | null
          white_label_enabled?: boolean
          custom_brand_name?: string | null
          custom_domain?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
        Relationships: []
      }
      plan_catalog: {
        Row: {
          id: string
          code: string
          name: string
          description: string
          monthly_price_usd: number
          annual_price_usd: number
          stripe_price_monthly_id: string | null
          stripe_price_annual_id: string | null
          features: Json
          limits: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description: string
          monthly_price_usd?: number
          annual_price_usd?: number
          stripe_price_monthly_id?: string | null
          stripe_price_annual_id?: string | null
          features?: Json
          limits?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['plan_catalog']['Insert']>
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          organization_id: string
          plan: string
          status: string
          billing_interval: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          trial_ends_at: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          plan: string
          status?: string
          billing_interval?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          trial_ends_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
        Relationships: []
      }
      billing_events: {
        Row: {
          id: string
          organization_id: string | null
          event_type: string
          stripe_event_id: string
          payload: Json
          processed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          event_type: string
          stripe_event_id: string
          payload?: Json
          processed_at?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['billing_events']['Insert']>
        Relationships: []
      }
      usage_counters: {
        Row: {
          id: string
          organization_id: string
          metric: string
          period_start: string
          period_end: string
          value: number
          limit_value: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          metric: string
          period_start: string
          period_end: string
          value?: number
          limit_value?: number | null
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['usage_counters']['Insert']>
        Relationships: []
      }
      users: {
        Row: {
          id: string
          auth_user_id: string | null
          organization_id: string
          name: string
          email: string
          role: string
          avatar_initials: string
          two_fa_enabled: boolean
          failed_login_count: number
          locked_until: string | null
          last_login: string | null
          created_at: string
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          organization_id: string
          name: string
          email: string
          role?: string
          avatar_initials: string
          two_fa_enabled?: boolean
          failed_login_count?: number
          locked_until?: string | null
          last_login?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
        Relationships: []
      }
      vaults: {
        Row: {
          id: string
          organization_id: string
          name: string
          type: string
          status: string
          balance_usd: number
          signatories_required: number
          total_signatories: number
          blockchain_networks: string[]
          last_activity: string
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          type: string
          status?: string
          balance_usd?: number
          signatories_required: number
          total_signatories: number
          blockchain_networks: string[]
          last_activity?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['vaults']['Insert']>
        Relationships: []
      }
      vault_assets: {
        Row: {
          id: string
          vault_id: string
          symbol: string
          blockchain: string
          amount: number
          usd_value: number
          wallet_address: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          vault_id: string
          symbol: string
          blockchain: string
          amount?: number
          usd_value?: number
          wallet_address?: string | null
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['vault_assets']['Insert']>
        Relationships: []
      }
      approval_policies: {
        Row: {
          id: string
          organization_id: string
          name: string
          asset_symbol: string | null
          min_amount_usd: number | null
          max_amount_usd: number | null
          approvals_required: number
          approver_roles: string[]
          time_limit_minutes: number
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          asset_symbol?: string | null
          min_amount_usd?: number | null
          max_amount_usd?: number | null
          approvals_required: number
          approver_roles: string[]
          time_limit_minutes?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['approval_policies']['Insert']>
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          organization_id: string
          tx_hash: string | null
          asset_symbol: string
          amount: number
          amount_usd: number
          from_vault: string
          to_address: string
          to_institution: string | null
          status: string
          initiated_by: string
          blockchain: string
          gas_fee_usd: number
          approvals_required: number
          approvals_received: number
          batch_id: string | null
          rejection_reason: string | null
          created_at: string
          completed_at: string | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          tx_hash?: string | null
          asset_symbol: string
          amount: number
          amount_usd: number
          from_vault: string
          to_address: string
          to_institution?: string | null
          status?: string
          initiated_by: string
          blockchain: string
          gas_fee_usd?: number
          approvals_required: number
          approvals_received?: number
          batch_id?: string | null
          rejection_reason?: string | null
          created_at?: string
          completed_at?: string | null
          expires_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
        Relationships: []
      }
      batch_transactions: {
        Row: {
          id: string
          organization_id: string
          name: string
          asset_symbol: string
          blockchain: string
          status: string
          total_items: number
          total_amount_usd: number
          approvals_required: number
          approvals_received: number
          created_by: string
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          asset_symbol: string
          blockchain: string
          status?: string
          total_items?: number
          total_amount_usd?: number
          approvals_required?: number
          approvals_received?: number
          created_by: string
          created_at?: string
          completed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['batch_transactions']['Insert']>
        Relationships: []
      }
      batch_transaction_items: {
        Row: {
          id: string
          batch_id: string
          to_address: string
          to_institution: string | null
          amount: number
          amount_usd: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          batch_id: string
          to_address: string
          to_institution?: string | null
          amount: number
          amount_usd: number
          status?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['batch_transaction_items']['Insert']>
        Relationships: []
      }
      approvals: {
        Row: {
          id: string
          transaction_id: string
          approver_id: string
          action: string
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          approver_id: string
          action: string
          comment?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['approvals']['Insert']>
        Relationships: []
      }
      compliance_records: {
        Row: {
          id: string
          organization_id: string
          institution_name: string
          risk_level: string
          aml_status: string
          kyc_status: string
          compliance_score: number
          flagged_transactions: number
          last_review: string
          next_review: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          institution_name: string
          risk_level: string
          aml_status: string
          kyc_status: string
          compliance_score: number
          flagged_transactions?: number
          last_review: string
          next_review: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['compliance_records']['Insert']>
        Relationships: []
      }
      risk_profiles: {
        Row: {
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
        Insert: {
          id?: string
          organization_id: string
          risk_score?: number
          max_single_tx_usd?: number
          restricted_countries?: string[]
          restricted_assets?: string[]
          approval_escalation_enabled?: boolean
          screening_provider?: string | null
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['risk_profiles']['Insert']>
        Relationships: []
      }
      insurance_policies: {
        Row: {
          id: string
          organization_id: string
          provider_name: string
          policy_number: string
          status: string
          coverage_limit_usd: number
          deductible_usd: number
          covered_assets: string[]
          renewal_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          provider_name: string
          policy_number: string
          status?: string
          coverage_limit_usd?: number
          deductible_usd?: number
          covered_assets?: string[]
          renewal_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['insurance_policies']['Insert']>
        Relationships: []
      }
      portfolio_snapshots: {
        Row: {
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
        Insert: {
          id?: string
          organization_id: string
          snapshot_date: string
          total_auc_usd?: number
          hot_balance_usd?: number
          warm_balance_usd?: number
          cold_balance_usd?: number
          total_transactions_30d?: number
          api_calls_30d?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['portfolio_snapshots']['Insert']>
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
        Relationships: []
      }
      api_keys: {
        Row: {
          id: string
          organization_id: string
          name: string
          prefix: string
          key_hash: string
          permissions: string[]
          last_used_at: string | null
          expires_at: string | null
          revoked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          prefix: string
          key_hash: string
          permissions: string[]
          last_used_at?: string | null
          expires_at?: string | null
          revoked_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['api_keys']['Insert']>
        Relationships: []
      }
      webhooks: {
        Row: {
          id: string
          organization_id: string
          name: string
          url: string
          events: string[]
          signing_secret_hash: string
          status: string
          last_test_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          url: string
          events: string[]
          signing_secret_hash: string
          status?: string
          last_test_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['webhooks']['Insert']>
        Relationships: []
      }
      system_health: {
        Row: {
          id: string
          organization_id: string
          component: string
          status: string
          details: Json
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          component: string
          status: string
          details?: Json
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['system_health']['Insert']>
        Relationships: []
      }
      hsm_keys: {
        Row: {
          id: string
          organization_id: string
          vault_id: string | null
          provider: string
          label: string
          environment: string
          status: string
          key_reference: string
          assigned_policy: string | null
          last_rotated_at: string | null
          next_rotation_due: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          vault_id?: string | null
          provider: string
          label: string
          environment: string
          status?: string
          key_reference: string
          assigned_policy?: string | null
          last_rotated_at?: string | null
          next_rotation_due?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['hsm_keys']['Insert']>
        Relationships: []
      }
      report_exports: {
        Row: {
          id: string
          organization_id: string
          type: string
          status: string
          storage_path: string | null
          requested_by: string | null
          filters: Json
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          type: string
          status?: string
          storage_path?: string | null
          requested_by?: string | null
          filters?: Json
          created_at?: string
          completed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['report_exports']['Insert']>
        Relationships: []
      }
      analytics_kpi_snapshots: {
        Row: {
          id: string
          organization_id: string
          snapshot_date: string
          auc_usd: number
          transaction_volume_usd: number
          transaction_count: number
          approval_time_minutes: number
          uptime_percentage: number
          api_success_rate: number
          compliance_pass_rate: number
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          snapshot_date: string
          auc_usd?: number
          transaction_volume_usd?: number
          transaction_count?: number
          approval_time_minutes?: number
          uptime_percentage?: number
          api_success_rate?: number
          compliance_pass_rate?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['analytics_kpi_snapshots']['Insert']>
        Relationships: []
      }
      contact_requests: {
        Row: {
          id: string
          name: string
          email: string
          company: string
          use_case: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          company: string
          use_case: string
          message: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['contact_requests']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      current_org_id: {
        Args: Record<string, never>
        Returns: string
      }
      current_role: {
        Args: Record<string, never>
        Returns: string
      }
      seed_org_demo_data: {
        Args: {
          target_org_id: string
          owner_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
