'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Check,
  X,
  Lock,
  ArrowRight,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  cn,
  formatCurrency,
  formatCryptoAmount,
  formatAddress,
  formatRelativeTime,
} from '@/lib/utils'
import { useApiList } from '@/hooks/use-api-list'
import type { PendingApproval, User, Vault } from '@/types'

export function ApprovalsContent() {
  const { data: transactions, error, reload } = useApiList<PendingApproval>({
    endpoint: '/api/v1/approvals',
  })
  const { data: users } = useApiList<User>({
    endpoint: '/api/v1/users',
  })
  const { data: vaults } = useApiList<Vault>({
    endpoint: '/api/v1/vaults',
  })
  const pendingTransactions = transactions.filter((tx) => tx.status === 'pending' || tx.status === 'processing')
  const vaultNameById = useMemo(
    () => Object.fromEntries(vaults.map((vault) => [vault.id, vault.name])) as Record<string, string>,
    [vaults],
  )
  const userNameById = useMemo(
    () => Object.fromEntries(users.map((user) => [user.id, user.name])) as Record<string, string>,
    [users],
  )
  const [selectedTx, setSelectedTx] = useState<PendingApproval | null>(pendingTransactions[0] ?? null)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!pendingTransactions.length) {
      setSelectedTx(null)
      return
    }

    if (!selectedTx || !pendingTransactions.some((tx) => tx.id === selectedTx.id)) {
      setSelectedTx(pendingTransactions[0] ?? null)
    }
  }, [pendingTransactions, selectedTx])

  const approvalSteps = selectedTx?.approval_steps ?? []

  const handleApprove = async () => {
    if (!selectedTx) return

    setIsSubmitting(true)
    setActionError(null)

    try {
      const response = await fetch(`/api/v1/transactions/${selectedTx.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          comment: comment.trim() || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error(`Approval failed with status ${response.status}`)
      }

      setApproveDialogOpen(false)
      setComment('')
      reload()
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : 'Failed to approve transaction')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!selectedTx) return

    setIsSubmitting(true)
    setActionError(null)

    try {
      const response = await fetch(`/api/v1/transactions/${selectedTx.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          comment: comment.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error(`Rejection failed with status ${response.status}`)
      }

      setRejectDialogOpen(false)
      setComment('')
      reload()
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : 'Failed to reject transaction')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (error && pendingTransactions.length === 0) {
    return (
      <Alert className="border-amber/30 bg-amber-dim/20 text-amber">
        <AlertTitle>Approval queue unavailable</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (pendingTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-navy-border bg-navy/50 py-20">
        <Lock className="h-16 w-16 text-text-muted" />
        <h2 className="mt-6 text-xl font-semibold text-text-primary">No Pending Approvals</h2>
        <p className="mt-2 text-sm text-text-muted">
          All transactions have been reviewed. Check back later.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {(error || actionError) && (
        <Alert className="border-amber/30 bg-amber-dim/20 text-amber">
          <AlertTitle>Approval queue unavailable</AlertTitle>
          <AlertDescription>{actionError ?? error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Approvals</h1>
        <p className="mt-1 text-sm text-text-muted">
          Review and approve pending transaction requests
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Queue List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-text-muted">Pending Queue</h2>
            <Badge variant="secondary" className="bg-crimson-dim text-crimson">
              {pendingTransactions.length} pending
            </Badge>
          </div>
          <div className="space-y-2">
            {pendingTransactions.map((tx) => (
              <motion.button
                key={tx.id}
                whileHover={{ x: 4 }}
                onClick={() => setSelectedTx(tx)}
                className={cn(
                  'w-full rounded-lg border p-4 text-left transition-all',
                  selectedTx?.id === tx.id
                    ? 'border-cyan bg-cyan-dim/20'
                    : 'border-navy-border bg-navy hover:border-cyan-dim'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-mid font-mono text-sm font-bold text-text-primary"
                    >
                      {tx.asset_symbol}
                    </div>
                    <div>
                      <span className="font-mono text-sm font-medium text-text-primary">
                        {formatCryptoAmount(tx.amount, tx.asset_symbol)} {tx.asset_symbol}
                      </span>
                      <span className="mt-0.5 block text-xs text-text-muted">
                        {formatCurrency(tx.amount_usd, true)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 transition-colors',
                      selectedTx?.id === tx.id ? 'text-cyan' : 'text-text-muted'
                    )}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-text-muted">
                    {vaultNameById[tx.from_vault] ?? 'Unknown Vault'}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-full bg-navy-mid px-2 py-0.5">
                      <Check className="h-3 w-3 text-emerald" />
                      <span className="font-mono text-[10px] text-text-muted">
                        {tx.approvals_received}/{tx.approvals_required}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-amber">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px]">
                        {formatRelativeTime(tx.expires_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <AnimatePresence mode="wait">
          {selectedTx && (
            <motion.div
              key={selectedTx.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <Card className="sticky top-4 border-navy-border bg-navy p-6">
                {/* Transaction Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      Transaction Details
                    </h3>
                    <p className="mt-1 font-mono text-xs text-text-muted">
                      {formatAddress(selectedTx.id, 12, 8)}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'font-mono text-[10px] uppercase',
                      selectedTx.status === 'pending' && 'bg-amber-dim text-amber',
                      selectedTx.status === 'processing' && 'bg-cyan-dim text-cyan'
                    )}
                  >
                    {selectedTx.status}
                  </Badge>
                </div>

                {/* Transaction Details */}
                <div className="mt-6 space-y-4">
                  <div className="rounded-lg bg-navy-mid/50 p-4">
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <span className="text-xs text-text-muted">From</span>
                        <p className="mt-1 text-sm font-medium text-text-primary">
                          {vaultNameById[selectedTx.from_vault] ?? 'Unknown Vault'}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-text-muted" />
                      <div className="text-center">
                        <span className="text-xs text-text-muted">To</span>
                        <p className="mt-1 text-sm font-medium text-text-primary">
                          {selectedTx.to_institution ?? 'External'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-navy-mid/50 p-4">
                      <span className="text-xs text-text-muted">Amount</span>
                      <p className="mt-1 font-mono text-xl font-semibold text-text-primary">
                        {formatCryptoAmount(selectedTx.amount, selectedTx.asset_symbol)}{' '}
                        <span className="text-sm text-text-muted">{selectedTx.asset_symbol}</span>
                      </p>
                      <p className="mt-0.5 font-mono text-sm text-text-muted">
                        {formatCurrency(selectedTx.amount_usd)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-navy-mid/50 p-4">
                      <span className="text-xs text-text-muted">Network</span>
                      <p className="mt-1 text-sm font-medium capitalize text-text-primary">
                        {selectedTx.blockchain}
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        Est. gas: ${selectedTx.gas_fee_usd.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-navy-mid/50 p-4">
                    <span className="text-xs text-text-muted">Destination Address</span>
                    <p className="mt-1 break-all font-mono text-sm text-text-primary">
                      {selectedTx.to_address}
                    </p>
                  </div>
                </div>

                {/* Approval Stepper */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-text-muted">Approval Progress</h4>
                  <div className="mt-4 space-y-3">
                    {approvalSteps.map((step, index) => (
                      <div
                        key={step.approver_id}
                        className={cn(
                          'flex items-center gap-4 rounded-lg p-3 transition-colors',
                          step.status === 'approved' && 'bg-emerald-dim/20',
                          step.status === 'pending' && 'bg-navy-mid/50'
                        )}
                      >
                        <Avatar className="h-10 w-10 border border-navy-border">
                          <AvatarFallback className="bg-navy-mid text-sm text-text-primary">
                            {step.approver_name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text-primary">
                            {step.approver_name}
                          </p>
                          <p className="text-xs capitalize text-text-muted">{step.approver_role}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {step.status === 'approved' ? (
                            <>
                              <Check className="h-4 w-4 text-emerald" />
                              <span className="text-xs text-emerald">Approved</span>
                            </>
                          ) : step.status === 'rejected' ? (
                            <>
                              <X className="h-4 w-4 text-crimson" />
                              <span className="text-xs text-crimson">Rejected</span>
                            </>
                          ) : (
                            <>
                              <span className="h-2 w-2 animate-pulse rounded-full bg-amber" />
                              <span className="text-xs text-amber">Waiting</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* High Value Warning */}
                {selectedTx.amount_usd >= 1000000 && (
                  <div className="mt-6 flex items-start gap-3 rounded-lg bg-amber-dim/20 p-4">
                    <AlertCircle className="h-5 w-5 shrink-0 text-amber" />
                    <div>
                      <p className="text-sm font-medium text-amber">High-Value Transaction</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        This transaction exceeds $1M and requires additional verification.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={() => setApproveDialogOpen(true)}
                    className="h-12 flex-1 bg-emerald text-obsidian hover:bg-emerald/90"
                    disabled={isSubmitting}
                  >
                    <Check className="mr-2 h-5 w-5" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRejectDialogOpen(true)}
                    className="h-12 flex-1 border-crimson text-crimson hover:bg-crimson-dim"
                    disabled={isSubmitting}
                  >
                    <X className="mr-2 h-5 w-5" />
                    Reject
                  </Button>
                </div>

                {/* Timestamp */}
                <p className="mt-4 text-center text-xs text-text-muted">
                  Initiated {formatRelativeTime(selectedTx.created_at)} by{' '}
                  {userNameById[selectedTx.initiated_by] ?? 'Unknown'}
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent className="border-navy-border bg-navy">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text-primary">Approve Transaction</AlertDialogTitle>
            <AlertDialogDescription className="text-text-muted">
              You are about to approve a {formatCurrency(selectedTx?.amount_usd ?? 0, true)}{' '}
              transaction. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Add a comment (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="border-navy-border bg-navy-mid text-text-primary placeholder:text-text-muted"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-navy-border bg-navy-mid text-text-primary hover:bg-navy hover:text-text-primary">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-emerald text-obsidian hover:bg-emerald/90"
            >
              {isSubmitting ? 'Approving...' : 'Confirm Approval'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent className="border-navy-border bg-navy">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text-primary">Reject Transaction</AlertDialogTitle>
            <AlertDialogDescription className="text-text-muted">
              Please provide a reason for rejecting this transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Rejection reason (required)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="border-navy-border bg-navy-mid text-text-primary placeholder:text-text-muted"
              required
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-navy-border bg-navy-mid text-text-primary hover:bg-navy hover:text-text-primary">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!comment.trim() || isSubmitting}
              className="bg-crimson text-text-primary hover:bg-crimson/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
