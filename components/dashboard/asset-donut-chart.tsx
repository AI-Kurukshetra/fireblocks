'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Database } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts'
import type { PieSectorDataItem } from 'recharts/types/polar/Pie'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import type { AssetAllocation, Vault } from '@/types'

const COLORS = [
  'oklch(75% 0.180 210)', // BTC - cyan
  'oklch(65% 0.150 280)', // ETH - purple
  'oklch(80% 0.200 155)', // USDC - emerald
  'oklch(78% 0.180 65)',  // SOL - amber
  'oklch(52% 0.040 250)', // Other - muted
]

const ASSET_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  USDC: 'USD Coin',
  USDT: 'Tether',
  SOL: 'Solana',
  MATIC: 'Polygon',
}

const renderActiveShape = (props: PieSectorDataItem) => {
  const {
    cx = 0,
    cy = 0,
    innerRadius = 0,
    outerRadius = 0,
    startAngle = 0,
    endAngle = 0,
    fill = 'currentColor',
  } = props

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0 0 8px rgba(0, 0, 0, 0.3))' }}
      />
    </g>
  )
}

interface AssetDonutChartProps {
  vaults: Vault[]
}

export function AssetDonutChart({ vaults }: AssetDonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

  const bySymbol = new Map<string, number>()

  for (const vault of vaults) {
    for (const asset of vault.assets ?? []) {
      bySymbol.set(asset.symbol, (bySymbol.get(asset.symbol) ?? 0) + asset.usd_value)
    }
  }

  const totalAUC = [...bySymbol.values()].reduce((sum, value) => sum + value, 0)
  const assetData: AssetAllocation[] = [...bySymbol.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([symbol, usd_value], index, array) => ({
      symbol,
      name: ASSET_NAMES[symbol] ?? symbol,
      percentage: totalAUC > 0 ? Math.round((usd_value / totalAUC) * 100) : 0,
      usd_value,
      color: COLORS[index] ?? COLORS[COLORS.length - 1],
    }))
    .filter((asset, index, array) => {
      if (index < 4 || array.length <= 5) {
        return true
      }

      return false
    })

  if (!assetData.length) {
    return (
      <Card className="border-navy-border bg-navy p-5">
        <h3 className="text-sm font-medium text-text-muted">Asset Allocation</h3>
        <Empty className="mt-4 border-navy-border bg-navy-mid/30">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Database />
            </EmptyMedia>
            <EmptyTitle className="text-text-primary">No asset data yet</EmptyTitle>
            <EmptyDescription>
              Vault balances are live, but no asset allocation records exist in Supabase for this
              organization.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    )
  }

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index)
  }

  const onPieLeave = () => {
    setActiveIndex(undefined)
  }

  return (
    <Card className="border-navy-border bg-navy p-5">
      <h3 className="text-sm font-medium text-text-muted">Asset Allocation</h3>

      <div className="mt-4 flex flex-col items-center gap-6 lg:flex-row">
        {/* Chart */}
        <div className="relative h-64 w-64 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={assetData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                dataKey="percentage"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                animationBegin={0}
                animationDuration={1200}
                animationEasing="ease-out"
              >
                {assetData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="transparent"
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-text-muted">Total AUC</span>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="font-mono text-xl font-semibold text-text-primary"
            >
              {formatCurrency(totalAUC, true)}
            </motion.span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-1 flex-col gap-3">
          {assetData.map((asset, index) => (
            <motion.div
              key={asset.symbol}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
              className="group flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-navy-mid"
            >
              <div
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: asset.color }}
              />
              <div className="flex flex-1 items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-text-primary group-hover:text-cyan">
                    {asset.name}
                  </span>
                  <span className="ml-2 font-mono text-xs text-text-muted">
                    {asset.symbol}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-medium text-text-primary">
                    {asset.percentage}%
                  </span>
                  <span className="ml-3 font-mono text-xs text-text-muted">
                    {formatCurrency(asset.usd_value, true)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Accessible data table fallback */}
      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-text-muted hover:text-text-primary">
          View data table
        </summary>
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="border-b border-navy-border">
              <th className="pb-2 text-left text-text-muted">Asset</th>
              <th className="pb-2 text-right text-text-muted">Allocation</th>
              <th className="pb-2 text-right text-text-muted">Value</th>
            </tr>
          </thead>
          <tbody>
            {assetData.map((asset) => (
              <tr key={asset.symbol} className="border-b border-navy-border/50">
                <td className="py-2 text-text-primary">{asset.name}</td>
                <td className="py-2 text-right font-mono text-text-primary">{asset.percentage}%</td>
                <td className="py-2 text-right font-mono text-text-muted">
                  {formatCurrency(asset.usd_value, true)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </Card>
  )
}
