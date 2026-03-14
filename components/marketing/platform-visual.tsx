'use client'

import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
} from 'recharts'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

const chartData = [
  { month: 'Jan', value: 24 },
  { month: 'Feb', value: 31 },
  { month: 'Mar', value: 36 },
  { month: 'Apr', value: 44 },
  { month: 'May', value: 51 },
  { month: 'Jun', value: 66 },
]

const toneMap = {
  cyan: {
    badge: 'border-cyan/20 bg-cyan-dim text-cyan',
    panel: 'border-cyan/20 bg-cyan-dim/70 text-cyan',
  },
  emerald: {
    badge: 'border-emerald/20 bg-emerald-dim text-emerald',
    panel: 'border-emerald/20 bg-emerald-dim/70 text-emerald',
  },
  amber: {
    badge: 'border-amber/20 bg-amber-dim text-amber',
    panel: 'border-amber/20 bg-amber-dim/70 text-amber',
  },
} as const

interface Signal {
  label: string
  value: string
}

interface FloatingCard {
  icon: LucideIcon
  title: string
  detail: string
  tone: keyof typeof toneMap
}

interface PlatformVisualProps {
  title: string
  description: string
  badge: string
  signals: Signal[]
  chips: string[]
  floatingCards: [FloatingCard, FloatingCard]
  className?: string
}

function FloatingPanel({
  card,
  className,
}: {
  card: FloatingCard
  className: string
}) {
  const Icon = card.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={cn(
        'absolute hidden w-56 rounded-3xl border bg-background/92 p-4 shadow-[0_24px_60px_-36px_rgba(2,132,199,0.45)] backdrop-blur xl:block',
        toneMap[card.tone].panel,
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-current/15 bg-background/90">
          <Icon className="h-4 w-4" />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{card.title}</p>
          <p className="text-xs leading-5 text-muted-foreground">{card.detail}</p>
        </div>
      </div>
    </motion.div>
  )
}

export function PlatformVisual({
  title,
  description,
  badge,
  signals,
  chips,
  floatingCards,
  className,
}: PlatformVisualProps) {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-x-[10%] top-8 h-32 rounded-full bg-cyan-dim blur-3xl" />
      <div className="absolute bottom-8 right-8 h-28 w-28 rounded-full bg-emerald-dim blur-3xl" />

      <FloatingPanel card={floatingCards[0]} className="-left-6 top-16" />
      <FloatingPanel card={floatingCards[1]} className="-right-4 bottom-18" />

      <Card className="relative overflow-hidden rounded-[2rem] border-border/60 bg-card/86 shadow-[0_36px_120px_-52px_rgba(2,132,199,0.45)]">
        <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-cyan)_9%,transparent),transparent)]" />
        <CardHeader className="relative gap-4 border-b border-border/60 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <Badge variant="outline" className={cn('rounded-full px-3 py-1', toneMap.cyan.badge)}>
                {badge}
              </Badge>
              <div className="space-y-2">
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription className="max-w-xl text-sm leading-6">
                  {description}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative grid gap-6 p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {signals.map((signal, index) => (
              <motion.div
                key={signal.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 + index * 0.06 }}
                className="rounded-[1.5rem] border border-border/60 bg-background/85 p-5"
              >
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  {signal.label}
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight">{signal.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="rounded-[1.75rem] border border-border/60 bg-background/82 p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Controlled throughput</p>
                <p className="text-sm text-muted-foreground">
                  Secure volume, approvals, and policy posture over time.
                </p>
              </div>
              <Badge variant="outline" className={cn('rounded-full px-3 py-1', toneMap.emerald.badge)}>
                Real-time visibility
              </Badge>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="platformVisualFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-cyan)" stopOpacity={0.34} />
                      <stop offset="95%" stopColor="var(--color-cyan)" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis axisLine={false} dataKey="month" tickLine={false} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-cyan)"
                    strokeWidth={2.5}
                    fill="url(#platformVisualFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-border/60 bg-background/82 px-4 py-2 text-sm text-muted-foreground"
              >
                {chip}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
