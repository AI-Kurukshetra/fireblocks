import type { Metadata } from 'next'
import { HomePage } from '@/components/marketing/home-page'
import { SiteFooter } from '@/components/marketing/site-footer'
import { SiteHeader } from '@/components/marketing/site-header'
import { getSession } from '@/lib/auth/get-session'

export const metadata: Metadata = {
  title: 'Fireblocks | Institutional Digital Asset Operations',
  description:
    'Fireblocks gives institutions one operating system for custody, approvals, compliance, treasury controls, and secure digital asset execution.',
}

export default async function Home() {
  const session = await getSession()
  const isAuthenticated = Boolean(session)

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,theme(colors.cyan/.14),transparent_42%),radial-gradient(circle_at_80%_0%,theme(colors.emerald/.12),transparent_28%)]" />
      <SiteHeader isAuthenticated={isAuthenticated} />
      <main>
        <HomePage isAuthenticated={isAuthenticated} />
      </main>
      <SiteFooter isAuthenticated={isAuthenticated} />
    </div>
  )
}
