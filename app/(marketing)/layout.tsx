import { SiteFooter } from '@/components/marketing/site-footer'
import { SiteHeader } from '@/components/marketing/site-header'
import { getSession } from '@/lib/auth/get-session'

export default async function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,theme(colors.cyan/.14),transparent_42%),radial-gradient(circle_at_80%_0%,theme(colors.emerald/.12),transparent_28%)]" />
      <SiteHeader isAuthenticated={Boolean(session)} />
      <main>{children}</main>
      <SiteFooter isAuthenticated={Boolean(session)} />
    </div>
  )
}
