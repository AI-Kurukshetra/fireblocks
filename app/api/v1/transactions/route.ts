import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { logAction } from '@/lib/audit/log-action'
import { getPagination } from '@/lib/api/request'
import { fail, ok } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { initiateTransactionSchema } from '@/lib/schemas/transaction'
import type { Database } from '@/types/database'

function inferApprovalCount(amountUsd: number) {
  if (amountUsd >= 1_000_000) {
    return 3
  }

  return 2
}

export const GET = withAuth(async (request: NextRequest, { session }) => {
  const searchParams = new URL(request.url).searchParams
  const { page, limit, offset } = getPagination(searchParams)
  const status = searchParams.get('status')
  const asset = searchParams.get('asset')
  const admin = createAdminClient()

  let query = admin
    .from('transactions')
    .select('*', { count: 'exact' })
    .eq('organization_id', session.orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  if (asset) {
    query = query.eq('asset_symbol', asset)
  }

  const { data, error, count } = await query

  if (error) {
    return fail('TRANSACTION_LIST_FAILED', 'Failed to list transactions', 500)
  }

  return ok(data ?? [], {
    page,
    limit,
    total: count ?? data?.length ?? 0,
  })
})

export const POST = withAuth(async (request: NextRequest, { session }) => {
  const body = await request.json().catch(() => null)
  const parsed = initiateTransactionSchema.safeParse(body)

  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid transaction payload', 422, {
      issues: parsed.error.flatten(),
    })
  }

  const admin = createAdminClient()

  const { data: vaultData, error: vaultError } = await admin
    .from('vaults')
    .select('*')
    .eq('organization_id', session.orgId)
    .eq('id', parsed.data.from_vault)
    .single()

  const vault = vaultData as Database['public']['Tables']['vaults']['Row'] | null

  if (vaultError || !vault) {
    return fail('VAULT_NOT_FOUND', 'Source vault not found', 404)
  }

  if (vault.status !== 'active') {
    return fail('VAULT_INACTIVE', 'Source vault is not active', 409)
  }

  if (vault.balance_usd < parsed.data.amount_usd) {
    return fail('INSUFFICIENT_BALANCE', 'Vault balance is insufficient for this transaction', 409)
  }

  const approvalsRequired = inferApprovalCount(parsed.data.amount_usd)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const txHash = createHash('sha256')
    .update(`${session.orgId}:${parsed.data.to_address}:${Date.now()}`)
    .digest('hex')

  const { data, error } = await admin
    .from('transactions')
    .insert({
      organization_id: session.orgId,
      tx_hash: parsed.data.blockchain === 'bitcoin' ? null : `0x${txHash}`,
      asset_symbol: parsed.data.asset_symbol,
      amount: parsed.data.amount,
      amount_usd: parsed.data.amount_usd,
      from_vault: parsed.data.from_vault,
      to_address: parsed.data.to_address,
      to_institution: parsed.data.to_institution ?? null,
      status: 'pending',
      initiated_by: session.userId,
      blockchain: parsed.data.blockchain,
      gas_fee_usd: Number((parsed.data.amount_usd * 0.00001).toFixed(4)),
      approvals_required: approvalsRequired,
      approvals_received: 0,
      expires_at: expiresAt,
    })
    .select('*')
    .single()

  const transaction = data as Database['public']['Tables']['transactions']['Row'] | null

  if (error || !transaction) {
    return fail('TRANSACTION_CREATE_FAILED', 'Failed to create transaction', 500)
  }

  await logAction({
    orgId: session.orgId,
    userId: session.userId,
    action: 'TRANSACTION_INITIATED',
    resourceType: 'transaction',
    resourceId: transaction.id,
    request,
    metadata: {
      asset_symbol: transaction.asset_symbol,
      amount_usd: transaction.amount_usd,
      approvals_required: transaction.approvals_required,
    },
  })

  return ok(transaction, undefined, { status: 201 })
})
