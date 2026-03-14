'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, MoreVertical, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  cn,
  formatCurrency,
  formatCryptoAmount,
  formatRelativeTime,
  getVaultTypeStyle,
  getBlockchainColor,
} from '@/lib/utils'
import type { Vault } from '@/types'

interface VaultCardProps {
  vault: Vault
  onDeposit?: (vault: Vault) => void
  onWithdraw?: (vault: Vault) => void
}

const blockchainIcons: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
  polygon: 'MATIC',
  arbitrum: 'ARB',
}

export function VaultCard({ vault, onDeposit, onWithdraw }: VaultCardProps) {
  const typeStyle = getVaultTypeStyle(vault.type)

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <Card
        className={cn(
          'relative overflow-hidden border-navy-border bg-navy p-5 transition-all duration-300',
          'hover:border-cyan-dim hover:shadow-lg hover:shadow-cyan/5'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/vaults/${vault.id}`}
              className="text-base font-semibold text-text-primary transition-colors hover:text-cyan"
            >
              {vault.name}
            </Link>
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] font-bold uppercase',
                typeStyle.bg,
                typeStyle.text
              )}
            >
              {vault.type}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-text-muted hover:bg-navy-mid hover:text-text-primary"
                aria-label="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-navy-border bg-navy">
              <DropdownMenuItem asChild className="text-text-primary focus:bg-navy-mid">
                <Link href={`/vaults/${vault.id}`}>View Details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-text-primary focus:bg-navy-mid">
                Transaction History
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-navy-border" />
              <DropdownMenuItem className="text-text-primary focus:bg-navy-mid">
                Edit Vault
              </DropdownMenuItem>
              <DropdownMenuItem className="text-crimson focus:bg-navy-mid focus:text-crimson">
                Archive Vault
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Balance */}
        <div className="mt-4">
          <span className="font-mono text-2xl font-semibold text-text-primary lg:text-3xl">
            {formatCurrency(vault.balance_usd, true)}
          </span>
        </div>

        {/* Assets */}
        <div className="mt-4 space-y-2">
          {(vault.assets ?? []).slice(0, 3).map((asset) => (
            <div
              key={asset.symbol}
              className="flex items-center justify-between rounded-lg bg-navy-mid/50 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: `${getBlockchainColor(asset.blockchain)}20`, color: getBlockchainColor(asset.blockchain) }}
                >
                  {asset.symbol.slice(0, 2)}
                </div>
                <span className="text-sm font-medium text-text-primary">{asset.symbol}</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm text-text-primary">
                  {formatCryptoAmount(asset.amount, asset.symbol)}
                </span>
                <span className="ml-2 font-mono text-xs text-text-muted">
                  {formatCurrency(asset.usd_value, true)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Signatories & Networks */}
        <div className="mt-4 flex items-center justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 rounded-full bg-navy-mid px-3 py-1.5">
                  <Lock className="h-3 w-3 text-text-muted" />
                  <span className="text-xs font-medium text-text-primary">
                    {vault.signatories_required} of {vault.total_signatories}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Requires {vault.signatories_required} of {vault.total_signatories} signatures
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center gap-1">
            {vault.blockchain_networks.map((network) => (
              <TooltipProvider key={network}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold"
                      style={{
                        backgroundColor: `${getBlockchainColor(network)}20`,
                        color: getBlockchainColor(network),
                      }}
                    >
                      {blockchainIcons[network] || network.slice(0, 3).toUpperCase()}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="capitalize">{network}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>

        {/* Last Activity */}
        <div className="mt-4 text-xs text-text-muted">
          Last activity: {formatRelativeTime(vault.last_activity)}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-navy-border bg-navy-mid/50 text-text-primary hover:bg-navy-mid hover:text-cyan"
            onClick={() => onDeposit?.(vault)}
          >
            <ArrowDownToLine className="mr-1.5 h-3.5 w-3.5" />
            Deposit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-navy-border bg-navy-mid/50 text-text-primary hover:bg-navy-mid hover:text-cyan"
            onClick={() => onWithdraw?.(vault)}
          >
            <ArrowUpFromLine className="mr-1.5 h-3.5 w-3.5" />
            Withdraw
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
