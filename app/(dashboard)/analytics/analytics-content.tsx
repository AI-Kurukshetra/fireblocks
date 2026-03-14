'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn, formatCurrency } from '@/lib/utils'

type Period = '7D' | '30D' | '90D' | '1Y'

// Generate AUC over time data
const generateAucData = (period: Period) => {
  const points = period === '7D' ? 7 : period === '30D' ? 30 : period === '90D' ? 12 : 12
  const data = []
  const baseValue = 4200000000
  
  for (let i = 0; i < points; i++) {
    const variance = Math.random() * 400000000 - 200000000
    const date = new Date()
    date.setDate(date.getDate() - (points - i))
    
    data.push({
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      value: baseValue + variance + i * 50000000,
    })
  }
  
  return data
}

// Volume by asset data
const volumeData = [
  { week: 'W1', BTC: 120, ETH: 80, USDC: 60, SOL: 30, Other: 15 },
  { week: 'W2', BTC: 150, ETH: 90, USDC: 70, SOL: 25, Other: 20 },
  { week: 'W3', BTC: 130, ETH: 100, USDC: 55, SOL: 35, Other: 18 },
  { week: 'W4', BTC: 180, ETH: 85, USDC: 65, SOL: 40, Other: 22 },
]

// Top assets data
const topAssets = [
  { symbol: 'BTC', name: 'Bitcoin', holdings: 17850.5, change24h: 2.4, change7d: 8.2, allocation: 42 },
  { symbol: 'ETH', name: 'Ethereum', holdings: 313000, change24h: -0.8, change7d: 5.1, allocation: 28 },
  { symbol: 'USDC', name: 'USD Coin', holdings: 867600000, change24h: 0.01, change7d: 0.02, allocation: 18 },
  { symbol: 'SOL', name: 'Solana', holdings: 1600000, change24h: 4.2, change7d: 12.5, allocation: 8 },
  { symbol: 'OTHER', name: 'Other', holdings: 192800000, change24h: 1.1, change7d: 3.2, allocation: 4 },
]

// Activity heatmap data (7 days x 24 hours)
const generateHeatmapData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const data: { day: string; hour: number; count: number }[] = []
  
  days.forEach((day) => {
    for (let hour = 0; hour < 24; hour++) {
      // Simulate higher activity during business hours
      const isBusinessHours = hour >= 9 && hour <= 17
      const isWeekday = day !== 'Sat' && day !== 'Sun'
      const baseCount = isWeekday && isBusinessHours ? 50 : 10
      const count = Math.floor(Math.random() * baseCount) + (isBusinessHours ? 20 : 5)
      data.push({ day, hour, count })
    }
  })
  
  return data
}

const heatmapData = generateHeatmapData()
const maxCount = Math.max(...heatmapData.map((d) => d.count))

const periods: Period[] = ['7D', '30D', '90D', '1Y']

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

export function AnalyticsContent() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('30D')
  const aucData = generateAucData(selectedPeriod)

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-navy-border bg-navy p-3 shadow-lg">
          <p className="text-xs text-text-muted">{label}</p>
          <p className="mt-1 font-mono text-sm font-medium text-text-primary">
            {formatCurrency(payload[0].value, true)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Analytics</h1>
          <p className="mt-1 text-sm text-text-muted">
            Portfolio performance and activity insights
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-navy-mid p-1">
          {periods.map((period) => (
            <Button
              key={period}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPeriod(period)}
              className={cn(
                'h-8 px-4 font-mono text-sm',
                selectedPeriod === period
                  ? 'bg-cyan text-obsidian hover:bg-cyan/90'
                  : 'text-text-muted hover:bg-navy hover:text-text-primary'
              )}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* AUC Over Time Chart */}
      <motion.div variants={item}>
        <Card className="border-navy-border bg-navy p-5">
          <h3 className="text-sm font-medium text-text-muted">Assets Under Custody Over Time</h3>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aucData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="aucGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(75% 0.180 210)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="oklch(75% 0.180 210)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(22% 0.045 250)" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'oklch(52% 0.040 250)', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'oklch(52% 0.040 250)', fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000000000).toFixed(1)}B`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="oklch(75% 0.180 210)"
                  strokeWidth={2}
                  fill="url(#aucGradient)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Volume by Asset */}
        <motion.div variants={item}>
          <Card className="border-navy-border bg-navy p-5">
            <h3 className="text-sm font-medium text-text-muted">Weekly Volume by Asset</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(22% 0.045 250)" vertical={false} />
                  <XAxis
                    dataKey="week"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'oklch(52% 0.040 250)', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'oklch(52% 0.040 250)', fontSize: 12 }}
                    tickFormatter={(value) => `$${value}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(14% 0.030 250)',
                      border: '1px solid oklch(22% 0.045 250)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'oklch(92% 0.010 250)' }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '16px' }}
                    formatter={(value) => <span style={{ color: 'oklch(52% 0.040 250)' }}>{value}</span>}
                  />
                  <Bar dataKey="BTC" stackId="a" fill="oklch(75% 0.180 210)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="ETH" stackId="a" fill="oklch(65% 0.150 280)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="USDC" stackId="a" fill="oklch(80% 0.200 155)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="SOL" stackId="a" fill="oklch(78% 0.180 65)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Other" stackId="a" fill="oklch(52% 0.040 250)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Activity Heatmap */}
        <motion.div variants={item}>
          <Card className="border-navy-border bg-navy p-5">
            <h3 className="text-sm font-medium text-text-muted">Transaction Activity Heatmap</h3>
            <div className="mt-4 overflow-x-auto">
              <div className="min-w-fit">
                <div className="mb-2 flex gap-1 pl-10">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3 text-center font-mono text-[8px] text-text-muted"
                    >
                      {i % 4 === 0 ? i : ''}
                    </div>
                  ))}
                </div>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="flex items-center gap-2">
                    <span className="w-8 text-right text-xs text-text-muted">{day}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 24 }).map((_, hour) => {
                        const dataPoint = heatmapData.find(
                          (d) => d.day === day && d.hour === hour
                        )
                        const opacity = dataPoint ? dataPoint.count / maxCount : 0
                        return (
                          <div
                            key={hour}
                            className="h-3 w-3 rounded-sm transition-all hover:scale-125"
                            style={{
                              backgroundColor: `oklch(75% 0.180 210 / ${0.1 + opacity * 0.9})`,
                            }}
                            title={`${day} ${hour}:00 - ${dataPoint?.count ?? 0} transactions`}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <span className="text-xs text-text-muted">Less</span>
                <div className="flex gap-0.5">
                  {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity, i) => (
                    <div
                      key={i}
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: `oklch(75% 0.180 210 / ${opacity})` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-text-muted">More</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Top Assets Table */}
      <motion.div variants={item}>
        <Card className="border-navy-border bg-navy">
          <div className="border-b border-navy-border px-5 py-4">
            <h3 className="font-medium text-text-primary">Top Assets Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-border text-left">
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-text-muted">
                    Asset
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                    Holdings
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                    24h %
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                    7d %
                  </th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-text-muted">
                    Allocation
                  </th>
                </tr>
              </thead>
              <tbody>
                {topAssets.map((asset) => (
                  <tr
                    key={asset.symbol}
                    className="border-b border-navy-border transition-colors hover:bg-navy-mid/50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-mid font-mono text-xs font-bold text-text-primary">
                          {asset.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-medium text-text-primary">{asset.name}</span>
                          <span className="ml-2 font-mono text-xs text-text-muted">
                            {asset.symbol}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-sm text-text-primary">
                      {asset.holdings.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div
                        className={cn(
                          'inline-flex items-center gap-1 font-mono text-sm',
                          asset.change24h >= 0 ? 'text-emerald' : 'text-crimson'
                        )}
                      >
                        {asset.change24h >= 0 ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                        {Math.abs(asset.change24h).toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div
                        className={cn(
                          'inline-flex items-center gap-1 font-mono text-sm',
                          asset.change7d >= 0 ? 'text-emerald' : 'text-crimson'
                        )}
                      >
                        {asset.change7d >= 0 ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                        {Math.abs(asset.change7d).toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Progress
                          value={asset.allocation}
                          className="h-2 w-24 bg-navy-mid [&>div]:bg-cyan"
                        />
                        <span className="font-mono text-xs text-text-muted">
                          {asset.allocation}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
