import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock3, Landmark, ShieldCheck, Wallet } from 'lucide-react'
import { getSession } from '@/lib/auth/get-session'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasSupabaseEnv } from '@/lib/supabase/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Database } from '@/types/database'
import {
  cn,
  formatAddress,
  formatCryptoAmount,
  formatCurrency,
  formatRelativeTime,
  getTxStatusStyle,
  getVaultTypeStyle,
} from '@/lib/utils'
import type { Transaction, User, Vault } from '@/types'

interface VaultDetailPageProps {
  params: Promise<{ id: string }>
}

async function getVaultBundle(id: string) {
  const session = await getSession()

  if (!session || !hasSupabaseEnv()) {
    return {
      vault: null,
      relatedTransactions: [],
      users: [],
      error: hasSupabaseEnv() ? 'Authentication is required to load this vault.' : 'Supabase is not configured for this workspace.',
    }
  }

  const admin = createAdminClient()
  const { data: vaultData } = await admin
    .from('vaults')
    .select('*, vault_assets(*)')
    .eq('organization_id', session.orgId)
    .eq('id', id)
    .single()
  const vaultRow = vaultData as (Database['public']['Tables']['vaults']['Row'] & {
    vault_assets?: Vault['assets']
  }) | null

  const { data: transactionRows } = await admin
    .from('transactions')
    .select('*')
    .eq('organization_id', session.orgId)
    .eq('from_vault', id)
    .order('created_at', { ascending: false })
    .limit(6)

  const { data: userRows } = await admin
    .from('users')
    .select('*')
    .eq('organization_id', session.orgId)

  const vault = vaultRow
    ? ({
        ...vaultRow,
        assets: vaultRow.vault_assets ?? [],
      } as Vault)
    : null

  return {
    vault,
    relatedTransactions: (transactionRows ?? []) as Transaction[],
    users: (userRows ?? []) as User[],
    error: null,
  }
}

export default async function VaultDetailPage({ params }: VaultDetailPageProps) {
  const { id } = await params
  const { vault, relatedTransactions, users, error } = await getVaultBundle(id)

  if (error) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" className="w-fit px-0 text-text-muted hover:bg-transparent hover:text-text-primary">
          <Link href="/vaults">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to vaults
          </Link>
        </Button>
        <Alert className="border-amber/30 bg-amber-dim/20 text-amber">
          <AlertTitle>Vault data unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!vault) {
    notFound()
  }

  const signers = users.slice(0, vault.total_signatories)
  const typeStyle = getVaultTypeStyle(vault.type)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <Button asChild variant="ghost" className="w-fit px-0 text-text-muted hover:bg-transparent hover:text-text-primary">
            <Link href="/vaults">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to vaults
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-text-primary">{vault.name}</h1>
            <Badge className={cn('capitalize', typeStyle.bg, typeStyle.text)}>{vault.type}</Badge>
            <Badge className="bg-muted text-text-primary capitalize">{vault.status}</Badge>
          </div>
          <p className="text-sm text-text-muted">
            Last activity {formatRelativeTime(vault.last_activity)}. Created {new Date(vault.created_at).toLocaleDateString('en-US')}.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-border bg-card/90">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Balance</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-text-primary">
                {formatCurrency(vault.balance_usd, true)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/90">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Signatures</p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">
                {vault.signatories_required}/{vault.total_signatories}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/90">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Networks</p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">
                {vault.blockchain_networks.length}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-border bg-card/90">
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
            <CardDescription>Assets currently secured inside this vault.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Asset</TableHead>
                  <TableHead>Blockchain</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">USD Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(vault.assets ?? []).map((asset) => (
                  <TableRow key={`${asset.symbol}-${asset.wallet_address}`} className="border-border">
                    <TableCell className="font-medium text-text-primary">{asset.symbol}</TableCell>
                    <TableCell className="capitalize text-text-muted">{asset.blockchain}</TableCell>
                    <TableCell className="font-mono text-xs text-text-muted">
                      {asset.wallet_address ? formatAddress(asset.wallet_address, 8, 5) : 'Masked'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-text-primary">
                      {formatCryptoAmount(asset.amount, asset.symbol)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-text-primary">
                      {formatCurrency(asset.usd_value, true)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border bg-card/90">
            <CardHeader>
              <CardTitle>Vault Controls</CardTitle>
              <CardDescription>Operational and policy details for this vault.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald" />
                <div>
                  <p className="font-medium text-text-primary">Multi-signature policy</p>
                  <p className="text-sm text-text-muted">
                    Requires {vault.signatories_required} of {vault.total_signatories} approvers for sensitive actions.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-4">
                <Landmark className="mt-0.5 h-5 w-5 text-cyan" />
                <div>
                  <p className="font-medium text-text-primary">Networks</p>
                  <p className="text-sm capitalize text-text-muted">
                    {vault.blockchain_networks.join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-4">
                <Clock3 className="mt-0.5 h-5 w-5 text-amber" />
                <div>
                  <p className="font-medium text-text-primary">Cold-path review</p>
                  <p className="text-sm text-text-muted">
                    Next operational review scheduled within 14 days based on current transaction cadence.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/90">
            <CardHeader>
              <CardTitle>Assigned Signers</CardTitle>
              <CardDescription>Representative signer roster for this vault.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {signers.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-xl border border-border bg-background/70 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-dim font-medium text-cyan">
                      {user.avatar_initials}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{user.name}</p>
                      <p className="text-xs capitalize text-text-muted">{user.role}</p>
                    </div>
                  </div>
                  <Badge className={user.two_fa_enabled ? 'bg-emerald-dim text-emerald' : 'bg-amber-dim text-amber'}>
                    {user.two_fa_enabled ? '2FA enabled' : '2FA pending'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border bg-card/90">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-cyan" />
            <CardTitle>Recent Transactions</CardTitle>
          </div>
          <CardDescription>Recent outbound activity connected to this vault.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Tx ID</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Initiated By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relatedTransactions.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={5} className="py-8 text-center text-text-muted">
                    No recent transactions for this vault.
                  </TableCell>
                </TableRow>
              ) : (
                relatedTransactions.map((transaction) => {
                  const initiator = users.find((user) => user.id === transaction.initiated_by)
                  const status = getTxStatusStyle(transaction.status)

                  return (
                    <TableRow key={transaction.id} className="border-border">
                      <TableCell className="font-mono text-xs text-text-primary">
                        {formatAddress(transaction.id, 8, 6)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-text-muted">
                        {formatAddress(transaction.to_address, 8, 5)}
                      </TableCell>
                      <TableCell className="text-text-muted">
                        {initiator?.name ?? 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(status.bg, status.text, 'capitalize')}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-text-primary">
                        {transaction.asset_symbol} {formatCryptoAmount(transaction.amount, transaction.asset_symbol)}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
