import { redirect } from 'next/navigation'
import { getOrgGuardState } from '@/lib/auth/get-org-guard-state'
import { SetupForm } from '@/components/setup/setup-form'

export default async function SetupPage() {
  const state = await getOrgGuardState()

  if (
    state?.organization?.onboarding_status === 'complete' &&
    ['active', 'trialing', 'manual'].includes(state.organization.subscription_status)
  ) {
    redirect('/dashboard')
  }

  return <SetupForm />
}
