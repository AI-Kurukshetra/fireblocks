'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Vault,
  ArrowLeftRight,
  CheckCircle2,
  Shield,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Hexagon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/hooks/use-sidebar'
import { useApiResource } from '@/hooks/use-api-resource'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useApprovalCount } from '@/hooks/use-approval-count'
import type { NavGroup } from '@/types'

const navGroups: NavGroup[] = [
  {
    label: 'OVERVIEW',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'ASSETS',
    items: [
      { title: 'Vaults', href: '/vaults', icon: Vault },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { title: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
      { title: 'Approvals', href: '/approvals', icon: CheckCircle2 },
    ],
  },
  {
    label: 'INSIGHTS',
    items: [
      { title: 'Compliance', href: '/compliance', icon: Shield },
      { title: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      { title: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { collapsed, toggle, setCollapsed } = useSidebar()
  const { count: approvalCount } = useApprovalCount()
  const { data: currentUser } = useApiResource<{
    userId: string
    authUserId: string
    orgId: string
    role: string
    email: string
    name: string
  }>({
    endpoint: '/api/v1/me',
  })
  const initials = (currentUser?.name ?? 'Vault User')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .padEnd(2, 'V')

  // Keyboard shortcut: Ctrl/Cmd + B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle])

  // Collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setCollapsed])

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="relative hidden h-screen flex-col border-r border-navy-border bg-navy md:flex"
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-navy-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan/10">
            <Hexagon className="h-5 w-5 text-cyan" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="text-lg font-semibold text-text-primary"
              >
                Fireblocks
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="scrollbar-thin flex-1 overflow-y-auto py-4">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mb-2 px-4 text-[10px] font-medium uppercase tracking-wider text-text-muted"
                  >
                    {group.label}
                  </motion.div>
                )}
              </AnimatePresence>
              <ul className="space-y-1 px-2">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`)
                  const Icon = item.icon
                  const badge = item.href === '/approvals' ? approvalCount : item.badge

                  const linkContent = (
                    <Link
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'border-l-2 border-cyan bg-navy-mid text-text-primary'
                          : 'border-l-2 border-transparent text-text-muted hover:bg-navy-mid hover:text-text-primary'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 shrink-0 transition-colors',
                          isActive ? 'text-cyan' : 'text-text-muted group-hover:text-text-primary'
                        )}
                      />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                            className="flex-1"
                          >
                            {item.title}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {!collapsed && badge && badge > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex h-5 min-w-5 items-center justify-center rounded-full bg-crimson px-1.5 text-[10px] font-bold text-text-primary pulse-crimson"
                        >
                          {badge}
                        </motion.span>
                      )}
                    </Link>
                  )

                  if (collapsed) {
                    return (
                      <li key={item.href}>
                        <Tooltip>
                          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                          <TooltipContent side="right" className="flex items-center gap-2">
                            {item.title}
                            {badge && badge > 0 && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-crimson px-1.5 text-[10px] font-bold">
                                {badge}
                              </span>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    )
                  }

                  return <li key={item.href}>{linkContent}</li>
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-navy-border p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-navy-border">
              <AvatarFallback className="bg-navy-mid text-xs font-medium text-text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex-1 overflow-hidden"
                >
                  <p className="truncate text-sm font-medium text-text-primary">
                    {currentUser?.name ?? 'Loading...'}
                  </p>
                  <p className="truncate text-xs capitalize text-text-muted">
                    {currentUser?.role ?? 'user'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            {!collapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <SignOutButton />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Sign out</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border border-navy-border bg-navy hover:bg-navy-mid"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronLeft className="h-3 w-3 text-text-muted" />
          </motion.div>
        </Button>
      </motion.aside>
    </TooltipProvider>
  )
}
