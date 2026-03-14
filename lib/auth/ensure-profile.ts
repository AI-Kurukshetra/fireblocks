import type { User as SupabaseUser } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

function toInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return 'VU'
  }

  const first = parts[0]?.[0] ?? 'V'
  const second = parts[1]?.[0] ?? first
  return `${first}${second}`.toUpperCase()
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function ensureUserProfile(authUser: SupabaseUser) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('users')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .single()

  const existingProfile = data as Database['public']['Tables']['users']['Row'] | null

  if (!error && existingProfile) {
    return existingProfile
  }

  const email = authUser.email ?? ''
  const { data: invitedData, error: invitedError } = await admin
    .from('users')
    .select('*')
    .eq('email', email)
    .is('auth_user_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const invitedProfile = invitedData as Database['public']['Tables']['users']['Row'] | null

  if (!invitedError && invitedProfile) {
    const fullName =
      (authUser.user_metadata?.full_name as string | undefined) ?? invitedProfile.name

    const { data: attachedData } = await admin
      .from('users')
      .update({
        auth_user_id: authUser.id,
        name: fullName,
        avatar_initials: toInitials(fullName),
        last_login: new Date().toISOString(),
      })
      .eq('id', invitedProfile.id)
      .select('*')
      .single()

    return (attachedData as Database['public']['Tables']['users']['Row'] | null) ?? invitedProfile
  }

  const fullName =
    (authUser.user_metadata?.full_name as string | undefined) ??
    email.split('@')[0] ??
    'Fireblocks User'
  const organizationName =
    (authUser.user_metadata?.organization_name as string | undefined) ??
    `${fullName.split(' ')[0] ?? 'Fireblocks'} Capital`

  const { data: organizationData, error: organizationError } = await admin
    .from('organizations')
    .insert({
      name: organizationName,
      legal_name: organizationName,
      slug: `${toSlug(organizationName) || 'fireblocks'}-${authUser.id.slice(0, 8)}`,
      plan: 'starter',
      subscription_status: 'pending',
      onboarding_status: 'pending_setup',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('*')
    .single()

  const organization = organizationData as Database['public']['Tables']['organizations']['Row'] | null

  if (organizationError || !organization) {
    const { data: retryData } = await admin
      .from('users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single()

    return (retryData as Database['public']['Tables']['users']['Row'] | null) ?? null
  }

  const { data: profileData, error: profileError } = await admin
    .from('users')
    .insert({
      auth_user_id: authUser.id,
      organization_id: organization.id,
      name: fullName,
      email,
      role: 'admin',
      avatar_initials: toInitials(fullName),
      two_fa_enabled: false,
      last_login: new Date().toISOString(),
    })
    .select('*')
    .single()

  const profile = profileData as Database['public']['Tables']['users']['Row'] | null

  if (profileError || !profile) {
    const { data: retryData } = await admin
      .from('users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single()

    return (retryData as Database['public']['Tables']['users']['Row'] | null) ?? null
  }

  return profile
}
