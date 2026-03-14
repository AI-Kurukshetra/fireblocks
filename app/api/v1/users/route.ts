import { NextRequest } from 'next/server'
import { logAction } from '@/lib/audit/log-action'
import { ok, fail } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { withRole } from '@/lib/auth/with-role'
import { inviteUserSchema } from '@/lib/schemas/user'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasSupabaseEnv } from '@/lib/supabase/shared'
import type { Database } from '@/types/database'

export const GET = withAuth(
  withRole(['admin', 'approver', 'analyst', 'viewer'])(
    async (_request: NextRequest, { session }) => {
      const admin = createAdminClient()
      const { data, error } = await admin
        .from('users')
        .select('*')
        .eq('organization_id', session.orgId)
        .order('created_at', { ascending: true })

      if (error) {
        return fail('USER_LIST_FAILED', 'Failed to list users', 500)
      }

      return ok(data ?? [])
    },
  ),
)

export const POST = withAuth(
  withRole(['admin'])(async (request: NextRequest, { session }) => {
    const body = await request.json().catch(() => null)
    const parsed = inviteUserSchema.safeParse(body)

    if (!parsed.success) {
      return fail('VALIDATION_ERROR', 'Invalid invite payload', 422, {
        issues: parsed.error.flatten(),
      })
    }

    if (!hasSupabaseEnv()) {
      return fail('SUPABASE_NOT_CONFIGURED', 'Supabase is not configured', 500)
    }

    const admin = createAdminClient()
    const { data: existingUser } = await admin
      .from('users')
      .select('id')
      .eq('organization_id', session.orgId)
      .eq('email', parsed.data.email)
      .maybeSingle()

    if (existingUser) {
      return fail('USER_EXISTS', 'A member with this email already exists in the organization', 409)
    }

    const inviteResult = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
      data: {
        full_name: parsed.data.name,
        invited_role: parsed.data.role,
        organization_id: session.orgId,
      },
      redirectTo: process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
        : undefined,
    })

    if (inviteResult.error) {
      return fail('INVITE_FAILED', inviteResult.error.message, 500)
    }

    const initials = parsed.data.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
      .padEnd(2, 'X')

    const invitedAuthUserId = inviteResult.data.user?.id ?? null
    let data = null
    let error = null

    if (invitedAuthUserId) {
      const { data: autoProvisioned } = await admin
        .from('users')
        .select('*')
        .eq('auth_user_id', invitedAuthUserId)
        .maybeSingle()

      const autoProfile = autoProvisioned as Database['public']['Tables']['users']['Row'] | null

      if (autoProfile) {
        const { data: updatedData, error: updateError } = await admin
          .from('users')
          .update({
            organization_id: session.orgId,
            name: parsed.data.name,
            email: parsed.data.email,
            role: parsed.data.role,
            avatar_initials: initials,
            two_fa_enabled: false,
            last_login: null,
          })
          .eq('id', autoProfile.id)
          .select('*')
          .single()

        if (!updateError && autoProfile.organization_id !== session.orgId) {
          await admin.from('organizations').delete().eq('id', autoProfile.organization_id)
        }

        data = updatedData
        error = updateError
      } else {
        const insertResult = await admin
          .from('users')
          .insert({
            auth_user_id: invitedAuthUserId,
            organization_id: session.orgId,
            name: parsed.data.name,
            email: parsed.data.email,
            role: parsed.data.role,
            avatar_initials: initials,
            two_fa_enabled: false,
            last_login: null,
          })
          .select('*')
          .single()

        data = insertResult.data
        error = insertResult.error
      }
    }

    if (error || !data) {
      return fail('USER_CREATE_FAILED', 'Failed to create invited member', 500)
    }

    await logAction({
      orgId: session.orgId,
      userId: session.userId,
      action: 'USER_INVITED',
      resourceType: 'user',
      resourceId: data.id,
      request,
      metadata: {
        email: data.email,
        role: data.role,
      },
    })

    return ok(data, undefined, { status: 201 })
  }),
)
