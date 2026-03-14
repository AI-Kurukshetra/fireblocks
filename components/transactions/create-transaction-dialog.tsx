'use client'

import { useMemo, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Vault } from '@/types'

const chainOptions = ['bitcoin', 'ethereum', 'solana', 'polygon', 'arbitrum'] as const

interface CreateTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vaults: Vault[]
  onSubmit: (payload: {
    from_vault: string
    asset_symbol: string
    amount: number
    amount_usd: number
    to_address: string
    to_institution: string | null
    blockchain: (typeof chainOptions)[number]
  }) => Promise<void>
}

export function CreateTransactionDialog({
  open,
  onOpenChange,
  vaults,
  onSubmit,
}: CreateTransactionDialogProps) {
  const [fromVault, setFromVault] = useState('')
  const [assetSymbol, setAssetSymbol] = useState('')
  const [amount, setAmount] = useState('')
  const [amountUsd, setAmountUsd] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [toInstitution, setToInstitution] = useState('')
  const [blockchain, setBlockchain] = useState<(typeof chainOptions)[number]>('ethereum')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const assetOptions = useMemo(() => {
    const selectedVault = vaults.find((vault) => vault.id === fromVault)
    return selectedVault?.assets?.map((asset) => asset.symbol) ?? []
  }, [fromVault, vaults])

  const canSubmit =
    fromVault &&
    assetSymbol.trim() &&
    Number(amount) > 0 &&
    Number(amountUsd) > 0 &&
    toAddress.trim().length >= 10

  const reset = () => {
    setFromVault('')
    setAssetSymbol('')
    setAmount('')
    setAmountUsd('')
    setToAddress('')
    setToInstitution('')
    setBlockchain('ethereum')
  }

  const handleSubmit = async () => {
    if (!canSubmit) {
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        from_vault: fromVault,
        asset_symbol: assetSymbol.trim().toUpperCase(),
        amount: Number(amount),
        amount_usd: Number(amountUsd),
        to_address: toAddress.trim(),
        to_institution: toInstitution.trim() ? toInstitution.trim() : null,
        blockchain,
      })
      onOpenChange(false)
      reset()
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Failed to create transaction.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
          <DialogDescription>
            Initiate a live outbound transaction from an existing vault.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Source vault</Label>
            <Select value={fromVault} onValueChange={setFromVault}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select vault" />
              </SelectTrigger>
              <SelectContent>
                {vaults.map((vault) => (
                  <SelectItem key={vault.id} value={vault.id}>
                    {vault.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Asset</Label>
            <Select value={assetSymbol} onValueChange={setAssetSymbol}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                {assetOptions.map((asset) => (
                  <SelectItem key={asset} value={asset}>
                    {asset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Blockchain</Label>
            <Select value={blockchain} onValueChange={(value) => setBlockchain(value as (typeof chainOptions)[number])}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {chainOptions.map((chain) => (
                  <SelectItem key={chain} value={chain}>
                    {chain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input value={amount} onChange={(event) => setAmount(event.target.value)} className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label>USD value</Label>
            <Input value={amountUsd} onChange={(event) => setAmountUsd(event.target.value)} className="bg-background" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Destination address</Label>
            <Input value={toAddress} onChange={(event) => setToAddress(event.target.value)} className="bg-background" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Institution</Label>
            <Input value={toInstitution} onChange={(event) => setToInstitution(event.target.value)} className="bg-background" placeholder="Optional" />
          </div>
          {error && (
            <div className="sm:col-span-2 flex items-start gap-2 rounded-lg border border-crimson/30 bg-crimson-dim/20 px-4 py-3 text-sm text-crimson">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-cyan text-obsidian hover:bg-cyan/90" disabled={!canSubmit || isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? 'Submitting...' : 'Create Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
