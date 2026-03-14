import type { NextRequest } from 'next/server'
import type { AuthContext } from './with-auth'
import { setupRequiredResponse, subscriptionRequiredResponse } from '@/lib/billing/entitlements'

type Handler<TParams extends Record<string, string> = Record<string, never>> = (
  request: NextRequest,
  ctx: { session: AuthContext; params: TParams },
) => Promise<Response>

export function withSetupComplete() {
  return <TParams extends Record<string, string> = Record<string, never>>(
    handler: Handler<TParams>,
  ): Handler<TParams> =>
    async (request, ctx) => {
      if (ctx.session.organization.onboarding_status !== 'complete') {
        return setupRequiredResponse()
      }

      if (!['active', 'trialing', 'manual'].includes(ctx.session.organization.subscription_status)) {
        return subscriptionRequiredResponse()
      }

      return handler(request, ctx)
    }
}
