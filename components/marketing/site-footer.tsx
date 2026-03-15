'use client'

import Link from 'next/link'
import { Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

const footerLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const

export function SiteFooter({
  isAuthenticated,
}: {
  isAuthenticated: boolean
}) {
  const href = isAuthenticated ? '/dashboard' : '/signup'

  return (
    <footer className="border-t border-border/60 bg-card/50 backdrop-blur-sm">
      <div className="grid w-full gap-16 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 2xl:px-14">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-cyan/30 bg-cyan-dim/50 text-cyan">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">Fireblocks</p>
              <p className="text-sm text-muted-foreground font-medium">
                Secure execution rails for institutional digital assets.
              </p>
            </div>
          </div>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Fireblocks brings custody orchestration, treasury controls, approval workflows,
            compliance oversight, and audit-ready reporting into one operator-grade console.
          </p>
          <motion.div whileHover={{ y: -2 }} className="inline-block">
            <Button asChild className="rounded-full px-6 h-11 font-semibold shadow-premium hover:shadow-premium-lg hover-lift">
              <Link href={href}>
                {isAuthenticated ? 'Go to dashboard' : 'Start your pilot'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>

        <div className="grid gap-12 sm:grid-cols-2">
          <div className="space-y-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Explore
            </p>
            <div className="grid gap-4 text-sm">
              {footerLinks.map((item) => (
                <Link key={item.href} href={item.href} className="font-medium text-foreground hover:text-cyan transition-colors duration-300">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Coverage
            </p>
            <div className="grid gap-4 text-sm">
              <p className="text-muted-foreground hover:text-cyan transition-colors cursor-default">Custody operations</p>
              <p className="text-muted-foreground hover:text-cyan transition-colors cursor-default">Approval orchestration</p>
              <p className="text-muted-foreground hover:text-cyan transition-colors cursor-default">Compliance reporting</p>
              <p className="text-muted-foreground hover:text-cyan transition-colors cursor-default">API-first treasury flows</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
