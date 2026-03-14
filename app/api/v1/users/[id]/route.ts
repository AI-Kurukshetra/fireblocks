import { NextRequest } from 'next/server'
import { logAction } from '@/lib/audit/log-action'
import { fail, ok } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { withRole } from '@/lib/auth/with-role'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

export const DELETE = withAuth<{ id: string }>(
  withRole(['admin'])(async (request: NextRequest, { session, params }) => {
    if (params.id === session.userId) {
      return fail('SELF_REMOVE_BLOCKED', 'You cannot remove your own account', 409)
    }

    const admin = createAdminClient()
    const { data: userData, error: userError } = await admin
      .from('users')
      .select('*')
      .eq('organization_id', session.orgId)
      .eq('id', params.id)
      .single()

    const user = userData as Database['public']['Tables']['users']['Row'] | null

    if (userError || !user) {
      return fail('USER_NOT_FOUND', 'Member not found', 404)
    }

    const [{ count: txCount }, { count: approvalCount }, { count: vaultCount }] = await Promise.all([
      admin
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', session.orgId)
        .eq('initiated_by', user.id),
      admin
        .from('approvals')
        .select('id', { count: 'exact', head: true })
        .eq('approver_id', user.id),
      admin
        .from('vaults')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', session.orgId)
        .eq('created_by', user.id),
    ])

    if (user.auth_user_id) {
      const authDelete = await admin.auth.admin.deleteUser(user.auth_user_id)
      if (authDelete.error) {
        return fail('AUTH_DELETE_FAILED', authDelete.error.message, 500)
      }
    }

    const hasHistory = (txCount ?? 0) > 0 || (approvalCount ?? 0) > 0 || (vaultCount ?? 0) > 0

    if (!hasHistory) {
      const { error: deleteError } = await admin
        .from('users')
        .delete()
        .eq('organization_id', session.orgId)
        .eq('id', user.id)

      if (deleteError) {
        return fail('USER_DELETE_FAILED', 'Failed to remove member', 500)
      }
    } else {
      const { error: updateError } = await admin
        .from('users')
        .update({
          auth_user_id: null,
          name: 'Removed User',
          email: `removed+${user.id}@vaultos.local`,
          role: 'viewer',
          avatar_initials: 'RM',
          two_fa_enabled: false,
          locked_until: '2126-01-01T00:00:00.000Z',
        })
        .eq('organization_id', session.orgId)
        .eq('id', user.id)

      if (updateError) {
        return fail('USER_DEACTIVATE_FAILED', 'Failed to deactivate member', 500)
      }
    }

    await logAction({
      orgId: session.orgId,
      userId: session.userId,
      action: hasHistory ? 'USER_DEACTIVATED' : 'USER_REMOVED',
      resourceType: 'user',
      resourceId: user.id,
      request,
      metadata: {
        email: user.email,
        mode: hasHistory ? 'deactivated' : 'deleted',
      },
    })

    return ok({
      id: user.id,
      mode: hasHistory ? 'deactivated' : 'deleted',
    })
  }),
)
