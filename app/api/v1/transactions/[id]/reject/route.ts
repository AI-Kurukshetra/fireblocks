import { NextRequest } from 'next/server'
import { logAction } from '@/lib/audit/log-action'
import { fail, ok } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { withRole } from '@/lib/auth/with-role'
import { approvalActionSchema } from '@/lib/schemas/transaction'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

export const POST = withAuth<{ id: string }>(
  withRole(['admin', 'approver'])(async (request: NextRequest, { session, params }) => {
    const body = await request.json().catch(() => null)
    const parsed = approvalActionSchema.safeParse(body)

    if (!parsed.success) {
      return fail('VALIDATION_ERROR', 'Invalid rejection payload', 422, {
        issues: parsed.error.flatten(),
      })
    }

    const admin = createAdminClient()
    const { data: transactionData, error: transactionError } = await admin
      .from('transactions')
      .select('*')
      .eq('organization_id', session.orgId)
      .eq('id', params.id)
      .single()

    const transaction = transactionData as Database['public']['Tables']['transactions']['Row'] | null

    if (transactionError || !transaction) {
      return fail('TRANSACTION_NOT_FOUND', 'Transaction not found', 404)
    }

    const { error: approvalError } = await admin.from('approvals').insert({
      transaction_id: transaction.id,
      approver_id: session.userId,
      action: 'rejected',
      comment: parsed.data.comment ?? null,
    })

    if (approvalError && approvalError.code !== '23505') {
      return fail('REJECTION_FAILED', 'Failed to record rejection', 500)
    }

    const { data: updatedData, error: updateError } = await admin
      .from('transactions')
      .update({
        status: 'rejected',
        rejection_reason: parsed.data.comment ?? 'Rejected during approval review',
        completed_at: new Date().toISOString(),
      })
      .eq('organization_id', session.orgId)
      .eq('id', params.id)
      .select('*')
      .single()

    const updatedTransaction = updatedData as Database['public']['Tables']['transactions']['Row'] | null

    if (updateError || !updatedTransaction) {
      return fail('TRANSACTION_UPDATE_FAILED', 'Failed to reject transaction', 500)
    }

    await logAction({
      orgId: session.orgId,
      userId: session.userId,
      action: 'APPROVAL_REJECTED',
      resourceType: 'transaction',
      resourceId: updatedTransaction.id,
      request,
      metadata: {
        rejection_reason: updatedTransaction.rejection_reason,
      },
    })

    return ok(updatedTransaction)
  }),
)
