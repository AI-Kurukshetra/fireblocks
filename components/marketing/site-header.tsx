'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Menu, Shield, ArrowRight } from 'lucide-react'
import { usePathname } from 'next/navigation'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const

export function SiteHeader({
  isAuthenticated,
}: {
  isAuthenticated: boolean
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const primaryHref = useMemo(
    () => (isAuthenticated ? '/dashboard' : '/signup'),
    [isAuthenticated],
  )

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl"
    >
      <div className="flex h-18 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-10 2xl:px-14">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan/20 bg-cyan-dim text-cyan shadow-[0_12px_30px_-18px_var(--color-cyan)]">
            <Shield className="h-5 w-5" />
          </span>
          <span className="space-y-0.5">
            <span className="block text-lg font-semibold tracking-tight">Fireblocks</span>
            <span className="block text-xs text-muted-foreground">
              Institutional digital asset operations
            </span>
          </span>
        </Link>

        <NavigationMenu viewport={false} className="hidden lg:flex">
          <NavigationMenuList className="gap-2">
            {navItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink asChild active={pathname === item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                      pathname === item.href
                        ? 'bg-cyan-dim text-cyan'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          {!isAuthenticated ? (
            <Button asChild variant="ghost" className="rounded-full">
              <Link href="/login">Sign in</Link>
            </Button>
          ) : null}
          <Button asChild className="rounded-full px-5">
            <Link href={primaryHref}>
              {isAuthenticated ? 'Open Dashboard' : 'Get Started'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs">
              <SheetHeader className="border-b border-border/60">
                <SheetTitle>Navigate Fireblocks</SheetTitle>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-3 px-4 py-6">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'rounded-2xl border px-4 py-3 text-sm font-medium transition-colors',
                        pathname === item.href
                          ? 'border-cyan/30 bg-cyan-dim text-cyan'
                          : 'border-border/60 bg-card/70 hover:bg-secondary',
                      )}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                {!isAuthenticated ? (
                  <SheetClose asChild>
                    <Link
                      href="/login"
                      className="rounded-2xl border border-border/60 px-4 py-3 text-sm font-medium"
                    >
                      Sign in
                    </Link>
                  </SheetClose>
                ) : null}
                <SheetClose asChild>
                  <Link
                    href={primaryHref}
                    className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
                  >
                    {isAuthenticated ? 'Open Dashboard' : 'Get Started'}
                  </Link>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  )
}
