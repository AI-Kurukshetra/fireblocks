import Link from 'next/link'
import { Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    <footer className="border-t border-border/60 bg-card/50">
      <div className="grid w-full gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 2xl:px-14">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan/20 bg-cyan-dim text-cyan">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-semibold">Fireblocks</p>
              <p className="text-sm text-muted-foreground">
                Secure execution rails for institutional digital assets.
              </p>
            </div>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Fireblocks brings custody orchestration, treasury controls, approval workflows,
            compliance oversight, and audit-ready reporting into one operator-grade console.
          </p>
          <Button asChild className="rounded-full px-5">
            <Link href={href}>
              {isAuthenticated ? 'Go to dashboard' : 'Start your pilot'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-10 sm:grid-cols-2">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Explore
            </p>
            <div className="grid gap-3 text-sm">
              {footerLinks.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-cyan">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Coverage
            </p>
            <div className="grid gap-3 text-sm text-muted-foreground">
              <p>Custody operations</p>
              <p>Approval orchestration</p>
              <p>Compliance reporting</p>
              <p>API-first treasury flows</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
