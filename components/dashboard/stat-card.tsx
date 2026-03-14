'use client'

import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCountUp } from '@/hooks/use-count-up'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts'
import type { StatCardProps } from '@/types'

interface ExtendedStatCardProps extends StatCardProps {
  onClick?: () => void
  icon?: React.ReactNode
  numericValue?: number
}

export function StatCard({
  title,
  value,
  delta,
  deltaPositive,
  sparklineData,
  badge,
  onClick,
  icon,
  numericValue,
}: ExtendedStatCardProps) {
  const animatedValue = useCountUp(numericValue ?? 0, {
    prefix: value.startsWith('$') ? '$' : '',
    decimals: 0,
  })

  const displayValue = numericValue !== undefined ? animatedValue : value

  const chartData = sparklineData?.map((val, i) => ({ value: val, index: i })) ?? []

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <Card
        onClick={onClick}
        className={cn(
          'relative overflow-hidden border-navy-border bg-navy p-5 transition-all duration-300',
          'hover:border-cyan-dim hover:shadow-lg hover:shadow-cyan/5',
          onClick && 'cursor-pointer'
        )}
      >
        {/* Sparkline background */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-16 opacity-30">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(75% 0.180 210)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(75% 0.180 210)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis domain={['dataMin', 'dataMax']} hide />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="oklch(75% 0.180 210)"
                  strokeWidth={1.5}
                  fill={`url(#gradient-${title})`}
                  isAnimationActive={true}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-muted">{title}</span>
            {icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-mid text-text-muted">
                {icon}
              </div>
            )}
          </div>

          <div className="mt-3 flex items-end justify-between">
            <div>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="block font-mono text-2xl font-semibold text-text-primary md:text-3xl"
              >
                {displayValue}
              </motion.span>

              {delta && (
                <div className="mt-1 flex items-center gap-1">
                  {deltaPositive ? (
                    <ArrowUp className="h-3 w-3 text-emerald" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-crimson" />
                  )}
                  <span
                    className={cn(
                      'font-mono text-xs font-medium',
                      deltaPositive ? 'text-emerald' : 'text-crimson'
                    )}
                  >
                    {delta}
                  </span>
                </div>
              )}
            </div>

            {badge && (
              <Badge
                variant="secondary"
                className={cn(
                  'font-mono text-[10px] font-bold uppercase',
                  badge.variant === 'danger' && 'bg-crimson-dim text-crimson pulse-crimson',
                  badge.variant === 'warning' && 'bg-amber-dim text-amber pulse-amber',
                  badge.variant === 'success' && 'bg-emerald-dim text-emerald'
                )}
              >
                {badge.label}
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
