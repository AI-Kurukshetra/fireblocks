import { NextRequest } from 'next/server'
import { fail, ok } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const GET = withAuth<{ id: string }>(async (_request: NextRequest, { session, params }) => {
  const admin = createAdminClient()

  const { data: transaction, error } = await admin
    .from('transactions')
    .select('*, approvals(*)')
    .eq('organization_id', session.orgId)
    .eq('id', params.id)
    .single()

  if (error || !transaction) {
    return fail('TRANSACTION_NOT_FOUND', 'Transaction not found', 404)
  }

  return ok(transaction)
})
