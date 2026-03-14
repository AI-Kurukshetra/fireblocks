import { ok } from '@/lib/api/response'
import { hasSupabaseEnv } from '@/lib/supabase/shared'

export async function GET() {
  return ok({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabaseConfigured: hasSupabaseEnv(),
  })
}
