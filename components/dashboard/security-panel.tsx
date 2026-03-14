'use client'

import { Shield, Server, Clock, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { SystemStatus } from '@/types'

function getStatusColor(status: SystemStatus['status']): string {
  const colors = {
    online: 'bg-emerald',
    degraded: 'bg-amber',
    offline: 'bg-crimson',
  }
  return colors[status]
}

function getStatusText(status: SystemStatus['status']): string {
  const text = {
    online: 'Online',
    degraded: 'Degraded',
    offline: 'Offline',
  }
  return text[status]
}

interface SecurityPanelProps {
  systems: SystemStatus[]
}

export function SecurityPanel({ systems }: SecurityPanelProps) {
  const allOnline = systems.length > 0 && systems.every((s) => s.status === 'online')
  const degradedCount = systems.filter((system) => system.status !== 'online').length
  const latestCheck = systems
    .map((system) => new Date(system.lastChecked).getTime())
    .filter((value) => !Number.isNaN(value))
    .sort((left, right) => right - left)[0]

  return (
    <Card className="border-navy-border bg-navy p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-muted">Security Status</h3>
        <div className="flex items-center gap-2">
          <Shield
            className={cn('h-5 w-5', allOnline ? 'text-emerald' : 'text-amber')}
          />
          <span className={cn('text-sm font-medium', allOnline ? 'text-emerald' : 'text-amber')}>
            {systems.length === 0
              ? 'No Telemetry'
              : allOnline
                ? 'All Systems Operational'
                : `${degradedCount} Issue${degradedCount === 1 ? '' : 's'} Detected`}
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {systems.map((system) => (
          <div
            key={system.component}
            className="flex items-center justify-between rounded-lg bg-navy-mid/50 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <Server className="h-4 w-4 text-text-muted" />
              <span className="text-sm text-text-primary">{system.component}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  getStatusColor(system.status),
                  system.status === 'online' && 'animate-pulse'
                )}
              />
              <span
                className={cn(
                  'text-xs font-medium',
                  system.status === 'online' && 'text-emerald',
                  system.status === 'degraded' && 'text-amber',
                  system.status === 'offline' && 'text-crimson'
                )}
              >
                {getStatusText(system.status)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-navy-border pt-4">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Clock className="h-3.5 w-3.5" />
          <span>
            Last check:{' '}
            {latestCheck ? new Date(latestCheck).toLocaleString('en-US') : 'No health checks'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1',
              allOnline ? 'bg-emerald-dim' : 'bg-amber-dim',
            )}
          >
            <Shield className={cn('h-3 w-3', allOnline ? 'text-emerald' : 'text-amber')} />
            <span className={cn('text-xs font-medium', allOnline ? 'text-emerald' : 'text-amber')}>
              {allOnline ? 'LOW' : 'ELEVATED'}
            </span>
          </div>
          <span className="text-xs text-text-muted">Threat Level</span>
        </div>
      </div>
    </Card>
  )
}
