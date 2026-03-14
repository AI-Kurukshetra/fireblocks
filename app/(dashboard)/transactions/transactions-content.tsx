'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Download, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreateTransactionDialog } from '@/components/transactions/create-transaction-dialog'
import { TransactionTable } from '@/components/transactions/transaction-table'
import { useApiList } from '@/hooks/use-api-list'
import { toast } from '@/hooks/use-toast'
import type { Transaction, TxStatus, Vault } from '@/types'

const statusOptions: TxStatus[] = ['pending', 'processing', 'approved', 'rejected', 'failed']

export function TransactionsContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [assetFilter, setAssetFilter] = useState<string>('all')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const { data: transactions, error: transactionsError, reload: reloadTransactions } = useApiList<Transaction>({
    endpoint: '/api/v1/transactions',
  })
  const { data: vaults, error: vaultsError } = useApiList<Vault>({
    endpoint: '/api/v1/vaults',
  })
  const assetOptions = [...new Set(transactions.map((tx) => tx.asset_symbol))]
  const vaultNameById = useMemo(
    () => Object.fromEntries(vaults.map((vault) => [vault.id, vault.name])) as Record<string, string>,
    [vaults],
  )

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.to_institution?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.to_address.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter
      const matchesAsset = assetFilter === 'all' || tx.asset_symbol === assetFilter
      return matchesSearch && matchesStatus && matchesAsset
    })
  }, [searchQuery, statusFilter, assetFilter])

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    if (value !== 'all') {
      setActiveFilters((prev) => {
        const filtered = prev.filter((f) => !statusOptions.includes(f as TxStatus))
        return [...filtered, value]
      })
    } else {
      setActiveFilters((prev) => prev.filter((f) => !statusOptions.includes(f as TxStatus)))
    }
  }

  const handleAssetChange = (value: string) => {
    setAssetFilter(value)
    if (value !== 'all') {
      setActiveFilters((prev) => {
        const filtered = prev.filter((f) => !assetOptions.includes(f))
        return [...filtered, value]
      })
    } else {
      setActiveFilters((prev) => prev.filter((f) => !assetOptions.includes(f)))
    }
  }

  const removeFilter = (filter: string) => {
    if (statusOptions.includes(filter as TxStatus)) {
      setStatusFilter('all')
    }
    if (assetOptions.includes(filter)) {
      setAssetFilter('all')
    }
    setActiveFilters((prev) => prev.filter((f) => f !== filter))
  }

  const clearAllFilters = () => {
    setStatusFilter('all')
    setAssetFilter('all')
    setSearchQuery('')
    setActiveFilters([])
  }

  const loadError = transactionsError ?? vaultsError

  return (
    <div className="space-y-6">
      {loadError && (
        <Alert className="border-amber/30 bg-amber-dim/20 text-amber">
          <AlertTitle>Transaction feed unavailable</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Transactions</h1>
          <p className="mt-1 text-sm text-text-muted">
            View and manage all digital asset transactions
          </p>
        </div>
        <Button className="bg-cyan text-obsidian hover:bg-cyan/90" onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Transaction
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="glass sticky top-0 z-10 -mx-4 space-y-3 border-b border-navy-border px-4 py-4 md:-mx-6 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Search by ID, address, or institution..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-navy-border bg-navy-mid pl-9 text-text-primary placeholder:text-text-muted"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-32 border-navy-border bg-navy-mid text-text-primary">
                <Filter className="mr-2 h-4 w-4 text-text-muted" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="border-navy-border bg-navy">
                <SelectItem value="all" className="text-text-primary focus:bg-navy-mid">
                  All Status
                </SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    className="capitalize text-text-primary focus:bg-navy-mid"
                  >
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assetFilter} onValueChange={handleAssetChange}>
              <SelectTrigger className="w-28 border-navy-border bg-navy-mid text-text-primary">
                <SelectValue placeholder="Asset" />
              </SelectTrigger>
              <SelectContent className="border-navy-border bg-navy">
                <SelectItem value="all" className="text-text-primary focus:bg-navy-mid">
                  All Assets
                </SelectItem>
                {assetOptions.map((asset) => (
                  <SelectItem
                    key={asset}
                    value={asset}
                    className="text-text-primary focus:bg-navy-mid"
                  >
                    {asset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="border-navy-border bg-navy-mid text-text-primary hover:bg-navy hover:text-cyan"
            >
              <Download className="mr-1.5 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="text-xs text-text-muted">Active filters:</span>
            {activeFilters.map((filter) => (
              <Badge
                key={filter}
                variant="secondary"
                className="gap-1 bg-cyan-dim text-cyan hover:bg-cyan-dim/80"
              >
                {filter}
                <button
                  onClick={() => removeFilter(filter)}
                  className="ml-1 rounded-full hover:bg-cyan/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-xs text-text-muted hover:text-text-primary"
            >
              Clear all
            </button>
          </motion.div>
        )}
      </div>

      {/* Transaction Table */}
      <TransactionTable data={filteredTransactions} vaultNameById={vaultNameById} />

      <CreateTransactionDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        vaults={vaults}
        onSubmit={async (payload) => {
          const response = await fetch('/api/v1/transactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(payload),
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(
              result.error?.message ?? `Transaction creation failed with status ${response.status}`,
            )
          }

          toast({
            title: 'Transaction created',
            description: 'The transaction has been submitted for approval.',
          })
          reloadTransactions()
        }}
      />
    </div>
  )
}
