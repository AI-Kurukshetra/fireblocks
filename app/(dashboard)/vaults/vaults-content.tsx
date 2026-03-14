'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, SlidersHorizontal } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { VaultCard } from '@/components/vaults/vault-card'
import { CreateVaultSheet } from '@/components/vaults/create-vault-sheet'
import { useApiList } from '@/hooks/use-api-list'
import { toast } from '@/hooks/use-toast'
import type { Vault, VaultType } from '@/types'

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
}

export function VaultsContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const { data: vaults, error, reload } = useApiList<Vault>({
    endpoint: '/api/v1/vaults',
  })

  const filteredVaults = vaults.filter((vault) => {
    const matchesSearch = vault.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || vault.type === typeFilter
    return matchesSearch && matchesType
  })

  const handleCreateVault = async (data: {
    name: string
    type: VaultType
    signatories: number
    totalSignatories: number
    networks: string[]
  }) => {
    const response = await fetch('/api/v1/vaults', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        name: data.name,
        type: data.type,
        signatories_required: data.signatories,
        total_signatories: data.totalSignatories,
        blockchain_networks: data.networks,
      }),
    })

    const payload = await response.json()

    if (!response.ok) {
      const message = payload.error?.message ?? `Vault creation failed with status ${response.status}`
      toast({
        title: 'Vault creation failed',
        description: message,
        variant: 'destructive',
      })
      throw new Error(message)
    }

    toast({
      title: 'Vault created',
      description: `${data.name} is now available in your workspace.`,
    })
    reload()
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-amber/30 bg-amber-dim/20 text-amber">
          <AlertTitle>Vault data unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Vaults</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage your institutional digital asset vaults
          </p>
        </div>
        <Button
          onClick={() => setIsCreateSheetOpen(true)}
          className="bg-cyan text-obsidian hover:bg-cyan/90"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Create Vault
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search vaults..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-navy-border bg-navy-mid pl-9 text-text-primary placeholder:text-text-muted"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full border-navy-border bg-navy-mid text-text-primary sm:w-40">
            <Filter className="mr-2 h-4 w-4 text-text-muted" />
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="border-navy-border bg-navy">
            <SelectItem value="all" className="text-text-primary focus:bg-navy-mid">
              All Types
            </SelectItem>
            <SelectItem value="hot" className="text-text-primary focus:bg-navy-mid">
              Hot Wallets
            </SelectItem>
            <SelectItem value="warm" className="text-text-primary focus:bg-navy-mid">
              Warm Storage
            </SelectItem>
            <SelectItem value="cold" className="text-text-primary focus:bg-navy-mid">
              Cold Storage
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vault Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {filteredVaults.map((vault) => (
          <motion.div key={vault.id} variants={item}>
            <VaultCard
              vault={vault}
              onDeposit={(v) => console.log('[v0] Deposit to:', v.name)}
              onWithdraw={(v) => console.log('[v0] Withdraw from:', v.name)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredVaults.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-navy-border bg-navy/50 py-16">
          <SlidersHorizontal className="h-12 w-12 text-text-muted" />
          <h3 className="mt-4 text-lg font-medium text-text-primary">No vaults found</h3>
          <p className="mt-2 text-sm text-text-muted">
            {searchQuery || typeFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No vault records exist in Supabase for this organization yet'}
          </p>
          {!searchQuery && typeFilter === 'all' && (
            <Button
              onClick={() => setIsCreateSheetOpen(true)}
              className="mt-4 bg-cyan text-obsidian hover:bg-cyan/90"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Create Vault
            </Button>
          )}
        </div>
      )}

      {/* Create Vault Sheet */}
      <CreateVaultSheet
        open={isCreateSheetOpen}
        onOpenChange={setIsCreateSheetOpen}
        onSubmit={handleCreateVault}
      />
    </div>
  )
}
