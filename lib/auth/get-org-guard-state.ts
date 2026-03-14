import { cache } from 'react'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { hasSupabaseEnv } from '@/lib/supabase/shared'

export const getOrgGuardState = cache(async () => {
  if (!hasSupabaseEnv()) {
    return null
  }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!profile?.organization_id) {
    return null
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('id, onboarding_status, subscription_status, plan, billing_interval')
    .eq('id', profile.organization_id)
    .maybeSingle()

  return {
    orgId: profile.organization_id,
    role: profile.role,
    organization,
  }
})
