'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import { DollarSign, Activity, Vault, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { StatCard } from '@/components/dashboard/stat-card'
import { AssetDonutChart } from '@/components/dashboard/asset-donut-chart'
import { TxTablePreview } from '@/components/dashboard/tx-table-preview'
import { SecurityPanel } from '@/components/dashboard/security-panel'
import { useApiList } from '@/hooks/use-api-list'
import { formatCurrency } from '@/lib/utils'
import type { SystemStatus, Vault as VaultType, Transaction } from '@/types'

const container: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
}

export function DashboardContent() {
  const router = useRouter()
  const { data: vaults, error: vaultsError } = useApiList<VaultType>({
    endpoint: '/api/v1/vaults',
  })
  const { data: transactions, error: transactionsError } = useApiList<Transaction>({
    endpoint: '/api/v1/transactions',
  })
  const { data: systems } = useApiList<SystemStatus>({
    endpoint: '/api/v1/system-health',
  })

  const summary = useMemo(() => {
    const totalAUC = vaults.reduce((sum, vault) => sum + vault.balance_usd, 0)
    const activeVaults = vaults.filter((vault) => vault.status === 'active').length
    const pendingApprovals = transactions.filter((transaction) => transaction.status === 'pending').length
    const recentTransactions = transactions.filter((transaction) => {
      const txDate = new Date(transaction.created_at)
      const dayAgo = new Date()
      dayAgo.setDate(dayAgo.getDate() - 1)
      return txDate > dayAgo
    })
    const volume24h = recentTransactions.reduce((sum, transaction) => sum + transaction.amount_usd, 0)

    return {
      totalAUC,
      activeVaults,
      pendingApprovals,
      volume24h,
      hotVaults: vaults.filter((vault) => vault.type === 'hot').length,
      warmVaults: vaults.filter((vault) => vault.type === 'warm').length,
      coldVaults: vaults.filter((vault) => vault.type === 'cold').length,
    }
  }, [transactions, vaults])

  const vaultNameById = useMemo(
    () =>
      Object.fromEntries(vaults.map((vault) => [vault.id, vault.name])) as Record<string, string>,
    [vaults],
  )
  const recentTransactions = useMemo(() => transactions.slice(0, 8), [transactions])
  const sparklineData = useMemo(() => {
    let running = 0

    return [...vaults]
      .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
      .map((vault) => {
        running += vault.balance_usd
        return running
      })
  }, [vaults])

  const loadError = vaultsError ?? transactionsError

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {loadError && (
        <Alert className="border-amber/30 bg-amber-dim/20 text-amber">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Live dashboard data unavailable</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Assets Under Custody"
          value={formatCurrency(summary.totalAUC, true)}
          numericValue={summary.totalAUC}
          sparklineData={sparklineData}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="24h Volume"
          value={formatCurrency(summary.volume24h, true)}
          numericValue={summary.volume24h}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          title="Active Vaults"
          value={summary.activeVaults.toString()}
          numericValue={summary.activeVaults}
          badge={{
            label: `${summary.hotVaults}H / ${summary.warmVaults}W / ${summary.coldVaults}C`,
            variant: 'success',
          }}
          icon={<Vault className="h-4 w-4" />}
        />
        <StatCard
          title="Pending Approvals"
          value={summary.pendingApprovals.toString()}
          numericValue={summary.pendingApprovals}
          badge={
            summary.pendingApprovals > 0
              ? { label: 'Action Required', variant: 'danger' }
              : undefined
          }
          onClick={() => router.push('/approvals')}
          icon={<AlertCircle className="h-4 w-4" />}
        />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={item}>
          <AssetDonutChart vaults={vaults} />
        </motion.div>
        <motion.div variants={item}>
          <SecurityPanel systems={systems} />
        </motion.div>
      </div>

      <motion.div variants={item}>
        <TxTablePreview data={recentTransactions} vaultNameById={vaultNameById} />
      </motion.div>
    </motion.div>
  )
}
