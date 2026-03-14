import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { requireSupabaseServiceEnv } from './shared'

export function createAdminClient() {
  const { url, serviceRoleKey } = requireSupabaseServiceEnv()

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
