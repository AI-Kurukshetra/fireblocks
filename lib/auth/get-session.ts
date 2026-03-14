import { cache } from 'react'
import { ensureUserProfile } from '@/lib/auth/ensure-profile'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { hasSupabaseEnv } from '@/lib/supabase/shared'
import type { UserRole } from '@/types'

export interface AuthContext {
  userId: string
  authUserId: string
  orgId: string
  role: UserRole
  email: string
  name: string
}

export const getSession = cache(async (): Promise<AuthContext | null> => {
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

  const profile = await ensureUserProfile(user)

  if (!profile) {
    return null
  }

  if (profile.locked_until && new Date(profile.locked_until) > new Date()) {
    return null
  }

  return {
    userId: profile.id,
    authUserId: user.id,
    orgId: profile.organization_id,
    role: profile.role as UserRole,
    email: profile.email,
    name: profile.name,
  }
})
