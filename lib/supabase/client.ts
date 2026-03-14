'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { requireSupabaseEnv } from './shared'

export function createClient() {
  const { url, anonKey } = requireSupabaseEnv()

  return createBrowserClient<Database>(url, anonKey)
}
