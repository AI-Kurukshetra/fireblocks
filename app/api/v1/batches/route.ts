import { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { withSetupComplete } from '@/lib/auth/with-setup'
import { withFeature } from '@/lib/auth/with-feature'
import { batchTransactionSchema } from '@/lib/schemas/batch'
import { createAdminClient } from '@/lib/supabase/admin'

export const GET = withAuth(
  withSetupComplete()(
    withFeature('transaction_batching')(async (_request: NextRequest, { session }) => {
      const admin = createAdminClient()
      const { data, error } = await admin
        .from('batch_transactions')
        .select('*')
        .eq('organization_id', session.orgId)
        .order('created_at', { ascending: false })

      if (error) {
        return fail('BATCH_LIST_FAILED', 'Failed to load batch transactions', 500)
      }

      return ok(data ?? [])
    }),
  ),
)

export const POST = withAuth(
  withSetupComplete()(
    withFeature('transaction_batching')(async (request: NextRequest, { session }) => {
      const body = await request.json().catch(() => null)
      const parsed = batchTransactionSchema.safeParse(body)

      if (!parsed.success) {
        return fail('VALIDATION_ERROR', 'Invalid batch payload', 422, {
          issues: parsed.error.flatten(),
        })
      }

      const admin = createAdminClient()
      const totalAmountUsd = parsed.data.items.reduce((sum, item) => sum + item.amount_usd, 0)
      const { data: batchData, error } = await admin
        .from('batch_transactions')
        .insert({
          organization_id: session.orgId,
          name: parsed.data.name,
          asset_symbol: parsed.data.asset_symbol,
          blockchain: parsed.data.blockchain,
          status: 'pending',
          total_items: parsed.data.items.length,
          total_amount_usd: totalAmountUsd,
          approvals_required: parsed.data.approvals_required,
          approvals_received: 0,
          created_by: session.userId,
        })
        .select('*')
        .single()

      if (error || !batchData) {
        return fail('BATCH_CREATE_FAILED', 'Failed to create batch transaction', 500)
      }

      const { error: itemError } = await admin.from('batch_transaction_items').insert(
        parsed.data.items.map((item) => ({
          batch_id: batchData.id,
          to_address: item.to_address,
          to_institution: item.to_institution || null,
          amount: item.amount,
          amount_usd: item.amount_usd,
          status: 'pending',
        })),
      )

      if (itemError) {
        return fail('BATCH_ITEM_CREATE_FAILED', 'Failed to create batch items', 500)
      }

      return ok(batchData, undefined, { status: 201 })
    }),
  ),
)
