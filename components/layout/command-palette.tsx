'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftRight,
  BarChart3,
  CheckCircle2,
  LayoutDashboard,
  Search,
  Settings,
  Shield,
  Vault,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import type { Vault as VaultType, Transaction } from '@/types'

const navigationItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Vaults', href: '/vaults', icon: Vault },
  { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Approvals', href: '/approvals', icon: CheckCircle2 },
  { label: 'Compliance', href: '/compliance', icon: Shield },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vaults: VaultType[]
  transactions: Transaction[]
}

export function CommandPalette({
  open,
  onOpenChange,
  vaults,
  transactions,
}: CommandPaletteProps) {
  const router = useRouter()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onOpenChange(!open)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange])

  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions])
  const topVaults = useMemo(() => vaults.slice(0, 5), [vaults])

  const navigate = (href: string) => {
    router.push(href)
    onOpenChange(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="max-w-2xl">
      <CommandInput placeholder="Search pages, vaults, transactions..." />
      <CommandList>
        <CommandEmpty>No matching results.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <CommandItem key={item.href} onSelect={() => navigate(item.href)}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                <CommandShortcut>Go</CommandShortcut>
              </CommandItem>
            )
          })}
        </CommandGroup>
        <CommandGroup heading="Vaults">
          {topVaults.map((vault) => (
            <CommandItem key={vault.id} onSelect={() => navigate(`/vaults/${vault.id}`)}>
              <Vault className="h-4 w-4" />
              <span>{vault.name}</span>
              <CommandShortcut>{vault.type}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Transactions">
          {recentTransactions.map((transaction) => (
            <CommandItem key={transaction.id} onSelect={() => navigate('/transactions')}>
              <Search className="h-4 w-4" />
              <span>{transaction.asset_symbol} transfer</span>
              <CommandShortcut>{transaction.status}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
