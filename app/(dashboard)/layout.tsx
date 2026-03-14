import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { getOrgGuardState } from '@/lib/auth/get-org-guard-state'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const state = await getOrgGuardState()

  if (
    state?.organization?.onboarding_status !== 'complete' ||
    !['active', 'trialing', 'manual'].includes(state?.organization?.subscription_status ?? 'pending')
  ) {
    redirect('/setup')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
