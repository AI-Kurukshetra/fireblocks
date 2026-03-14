'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Thermometer, Snowflake } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import type { VaultType } from '@/types'

interface CreateVaultSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: {
    name: string
    type: VaultType
    signatories: number
    totalSignatories: number
    networks: string[]
  }) => Promise<void>
}

const vaultTypes: { type: VaultType; icon: React.ReactNode; label: string; description: string; color: string }[] = [
  {
    type: 'hot',
    icon: <Flame className="h-5 w-5" />,
    label: 'Hot Wallet',
    description: 'Instant access for trading',
    color: 'crimson',
  },
  {
    type: 'warm',
    icon: <Thermometer className="h-5 w-5" />,
    label: 'Warm Storage',
    description: 'Balanced security & access',
    color: 'amber',
  },
  {
    type: 'cold',
    icon: <Snowflake className="h-5 w-5" />,
    label: 'Cold Storage',
    description: 'Maximum security',
    color: 'cyan',
  },
]

const blockchainOptions = [
  { id: 'bitcoin', label: 'Bitcoin', color: '#F7931A' },
  { id: 'ethereum', label: 'Ethereum', color: '#627EEA' },
  { id: 'solana', label: 'Solana', color: '#00FFA3' },
  { id: 'polygon', label: 'Polygon', color: '#8247E5' },
  { id: 'arbitrum', label: 'Arbitrum', color: '#28A0F0' },
]

export function CreateVaultSheet({ open, onOpenChange, onSubmit }: CreateVaultSheetProps) {
  const [name, setName] = useState('')
  const [selectedType, setSelectedType] = useState<VaultType>('warm')
  const [totalSignatories, setTotalSignatories] = useState([5])
  const [requiredSignatories, setRequiredSignatories] = useState([2])
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>(['ethereum'])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setIsSubmitting(false)
      setError(null)
    }
  }, [open])

  const handleNetworkToggle = (networkId: string) => {
    setSelectedNetworks((prev) =>
      prev.includes(networkId)
        ? prev.filter((n) => n !== networkId)
        : [...prev, networkId]
    )
  }

  const handleSubmit = async () => {
    if (name.length < 3 || selectedNetworks.length === 0) return

    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit?.({
        name,
        type: selectedType,
        signatories: requiredSignatories[0],
        totalSignatories: totalSignatories[0],
        networks: selectedNetworks,
      })

      onOpenChange(false)

      setName('')
      setSelectedType('warm')
      setTotalSignatories([5])
      setRequiredSignatories([2])
      setSelectedNetworks(['ethereum'])
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Failed to create vault.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValid = name.length >= 3 && selectedNetworks.length > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-navy-border bg-navy p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-navy-border px-6 py-5 pr-12">
          <SheetTitle className="text-text-primary">Create New Vault</SheetTitle>
          <SheetDescription className="text-text-muted">
            Configure your vault settings for secure asset storage.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6 pb-6">
            {/* Vault Name */}
            <div className="space-y-2">
              <Label htmlFor="vault-name" className="text-text-primary">
                Vault Name
              </Label>
              <Input
                id="vault-name"
                placeholder="e.g., Primary Cold Storage"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-navy-border bg-navy-mid text-text-primary placeholder:text-text-muted"
              />
              {name.length > 0 && name.length < 3 && (
                <p className="text-xs text-crimson">Name must be at least 3 characters</p>
              )}
            </div>

            {/* Vault Type */}
            <div className="space-y-3">
              <Label className="text-text-primary">Vault Type</Label>
              <div className="grid grid-cols-3 gap-3">
                {vaultTypes.map((vault) => (
                  <motion.button
                    key={vault.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedType(vault.type)}
                    type="button"
                    className={cn(
                      'flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border p-4 text-center transition-all',
                      selectedType === vault.type
                        ? vault.color === 'crimson'
                          ? 'border-crimson bg-crimson-dim'
                          : vault.color === 'amber'
                            ? 'border-amber bg-amber-dim'
                            : 'border-cyan bg-cyan-dim'
                        : 'border-navy-border bg-navy-mid hover:border-navy-border/80',
                    )}
                  >
                    <div
                      className={cn(
                        selectedType === vault.type
                          ? vault.color === 'crimson'
                            ? 'text-crimson'
                            : vault.color === 'amber'
                              ? 'text-amber'
                              : 'text-cyan'
                          : 'text-text-muted',
                      )}
                    >
                      {vault.icon}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        selectedType === vault.type ? 'text-text-primary' : 'text-text-muted',
                      )}
                    >
                      {vault.label}
                    </span>
                  </motion.button>
                ))}
              </div>
              <p className="text-xs text-text-muted">
                {vaultTypes.find((v) => v.type === selectedType)?.description}
              </p>
            </div>

            {/* Multi-sig Settings */}
            <div className="space-y-4">
              <Label className="text-text-primary">Multi-Signature Threshold</Label>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">Total Signatories</span>
                  <span className="font-mono text-text-primary">{totalSignatories[0]}</span>
                </div>
                <Slider
                  value={totalSignatories}
                  onValueChange={(value) => {
                    setTotalSignatories(value)
                    if (requiredSignatories[0] > value[0]) {
                      setRequiredSignatories(value)
                    }
                  }}
                  min={1}
                  max={7}
                  step={1}
                  className="py-2"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">Required Signatures</span>
                  <span className="font-mono text-text-primary">{requiredSignatories[0]}</span>
                </div>
                <Slider
                  value={requiredSignatories}
                  onValueChange={setRequiredSignatories}
                  min={1}
                  max={totalSignatories[0]}
                  step={1}
                  className="py-2"
                />
              </div>

              <div className="rounded-lg bg-navy-mid/50 p-3 text-center">
                <span className="text-sm text-text-muted">
                  Requires{' '}
                  <span className="font-mono font-medium text-cyan">{requiredSignatories[0]}</span>{' '}
                  of{' '}
                  <span className="font-mono font-medium text-cyan">{totalSignatories[0]}</span>{' '}
                  signatures
                </span>
              </div>
            </div>

            {/* Blockchain Networks */}
            <div className="space-y-3">
              <Label className="text-text-primary">Blockchain Networks</Label>
              <div className="space-y-2">
                {blockchainOptions.map((network) => (
                  <label
                    key={network.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg bg-navy-mid/50 px-4 py-3 transition-colors hover:bg-navy-mid"
                  >
                    <Checkbox
                      checked={selectedNetworks.includes(network.id)}
                      onCheckedChange={() => handleNetworkToggle(network.id)}
                      className="border-navy-border data-[state=checked]:border-cyan data-[state=checked]:bg-cyan"
                    />
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{
                        backgroundColor: `${network.color}20`,
                        color: network.color,
                      }}
                    >
                      {network.label.slice(0, 3).toUpperCase()}
                    </div>
                    <span className="text-sm text-text-primary">{network.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-crimson/30 bg-crimson-dim/20 px-4 py-3 text-sm text-crimson">
                {error}
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="border-t border-navy-border bg-navy px-6 py-4">
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full bg-cyan text-obsidian hover:bg-cyan/90 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Creating Vault...
              </>
            ) : (
              'Create Vault'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
