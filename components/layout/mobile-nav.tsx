'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Vault,
  ArrowLeftRight,
  CheckCircle2,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApprovalCount } from '@/hooks/use-approval-count'
import type { NavItem } from '@/types'

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Vaults', href: '/vaults', icon: Vault },
  { title: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { title: 'Approvals', href: '/approvals', icon: CheckCircle2 },
  { title: 'Settings', href: '/settings', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  const { count: approvalCount } = useApprovalCount()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg md:hidden">
      <ul className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          const badge = item.href === '/approvals' ? approvalCount : item.badge

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center gap-1 px-3 py-2 text-[10px] font-medium transition-colors',
                  isActive ? 'text-cyan' : 'text-text-muted'
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {badge && badge > 0 && (
                    <span className="absolute -right-1.5 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-crimson px-0.5 text-[8px] font-bold text-text-primary">
                      {badge}
                    </span>
                  )}
                </div>
                <span>{item.title}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-cyan"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
