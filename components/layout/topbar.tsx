'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Bell,
  ChevronDown,
  Command,
  Circle,
  ChevronRight,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { CommandPalette } from '@/components/layout/command-palette'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { useApiList } from '@/hooks/use-api-list'
import type { NotificationItem, Transaction, Vault } from '@/types'

const networks = [
  {
    name: 'Ethereum Mainnet',
    shortName: 'Ethereum',
    status: 'online' as const,
    color: '#627EEA',
  },
  {
    name: 'Bitcoin Mainnet',
    shortName: 'Bitcoin',
    status: 'online' as const,
    color: '#F7931A',
  },
  {
    name: 'Solana Mainnet',
    shortName: 'Solana',
    status: 'online' as const,
    color: '#00FFA3',
  },
  {
    name: 'Polygon Mainnet',
    shortName: 'Polygon',
    status: 'degraded' as const,
    color: '#8247E5',
  },
]

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: { label: string; href: string }[] = []

  let currentPath = ''
  for (const segment of segments) {
    currentPath += `/${segment}`
    const label =
      /^[0-9a-f-]{36}$/i.test(segment)
        ? 'Vault Detail'
        : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
    breadcrumbs.push({ label, href: currentPath })
  }

  return breadcrumbs
}

export function Topbar() {
  const pathname = usePathname()
  const [selectedNetwork, setSelectedNetwork] = useState(networks[0])
  const [commandOpen, setCommandOpen] = useState(false)
  const breadcrumbs = getBreadcrumbs(pathname)
  const { data: notifications } = useApiList<NotificationItem>({
    endpoint: '/api/v1/notifications',
  })
  const { data: vaults } = useApiList<Vault>({
    endpoint: '/api/v1/vaults',
    enabled: commandOpen,
  })
  const { data: transactions } = useApiList<Transaction>({
    endpoint: '/api/v1/transactions',
    enabled: commandOpen,
  })
  const unreadCount = notifications.filter((n) => !n.read).length

  const getNotificationTone = (notification: NotificationItem) => {
    switch (notification.severity) {
      case 'success':
        return 'text-emerald'
      case 'warning':
        return 'text-amber'
      case 'critical':
        return 'text-crimson'
      default:
        return 'text-cyan'
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm md:px-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-4 w-4 text-text-muted" />}
            <span
              className={cn(
                index === breadcrumbs.length - 1
                  ? 'font-medium text-text-primary'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              {crumb.label}
            </span>
          </div>
        ))}
      </nav>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Command palette trigger */}
        <Button
          variant="outline"
          className="hidden h-9 gap-2 border-border bg-muted/70 px-3 text-text-muted hover:bg-muted hover:text-text-primary lg:flex"
          aria-label="Open command palette"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">Search...</span>
          <kbd className="ml-4 flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] text-text-muted">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>

        {/* Network selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-9 max-w-[12.5rem] gap-2 border-border bg-muted/70 px-3 hover:bg-muted sm:max-w-none"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: selectedNetwork.color }}
              />
              <span className="min-w-0 flex-1 truncate text-left text-sm text-text-primary sm:hidden">
                {selectedNetwork.shortName}
              </span>
              <span className="hidden min-w-0 truncate text-sm text-text-primary sm:inline">
                {selectedNetwork.name}
              </span>
              <span
                className={cn(
                  'hidden rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] md:inline-flex',
                  selectedNetwork.status === 'online'
                    ? 'bg-emerald-dim text-emerald'
                    : 'bg-amber-dim text-amber',
                )}
              >
                {selectedNetwork.status}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-border bg-card">
            <DropdownMenuLabel className="text-text-muted">Select Network</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            {networks.map((network) => (
              <DropdownMenuItem
                key={network.name}
                onClick={() => setSelectedNetwork(network)}
                className="flex cursor-pointer items-center gap-3 text-text-primary focus:bg-muted"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: network.color }}
                />
                <div className="flex flex-1 flex-col">
                  <span>{network.name}</span>
                  <span
                    className={cn(
                      'text-[10px] uppercase tracking-[0.18em]',
                      network.status === 'online' ? 'text-emerald' : 'text-amber',
                    )}
                  >
                    {network.status}
                  </span>
                </div>
                {selectedNetwork.name === network.name ? (
                  <Check className="h-4 w-4 text-cyan" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 text-text-muted hover:bg-muted hover:text-text-primary"
              aria-label={`Notifications (${unreadCount} unread)`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-crimson px-1 text-[10px] font-bold text-text-primary"
                >
                  {unreadCount}
                </motion.span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-80 border-border bg-card p-0"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-medium text-text-primary">Notifications</h3>
              <Badge variant="secondary" className="bg-muted text-text-muted">
                {unreadCount} new
              </Badge>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <AnimatePresence>
                {notifications.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-text-muted">
                    No live notifications right now.
                  </div>
                )}
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'cursor-pointer border-b border-border px-4 py-3 transition-colors hover:bg-muted/70',
                      !notification.read && 'bg-cyan-dim/10'
                    )}
                  >
                    <Link
                      href={notification.href ?? pathname}
                      className="flex items-start gap-3"
                    >
                      {!notification.read && (
                        <Circle className="mt-1.5 h-2 w-2 shrink-0 fill-cyan text-cyan" />
                      )}
                      <div className={cn('flex-1', notification.read && 'ml-5')}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-text-primary">
                            {notification.title}
                          </p>
                          <Badge
                            variant="secondary"
                            className={cn(
                              'bg-muted text-[10px] uppercase',
                              getNotificationTone(notification),
                            )}
                          >
                            {notification.kind}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-text-muted">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-[10px] text-text-muted">
                          {formatRelativeTime(notification.created_at)}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="border-t border-border p-2">
              <Button
                variant="ghost"
                className="w-full text-cyan hover:bg-muted hover:text-cyan"
              >
                View all notifications
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <ThemeToggle />
      </div>
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        vaults={vaults}
        transactions={transactions}
      />
    </header>
  )
}
