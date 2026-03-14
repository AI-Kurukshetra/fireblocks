import type { NextRequest } from 'next/server'
import type { PlanFeatureKey } from '@/types'
import type { AuthContext } from './with-auth'
import { featureRequiredResponse } from '@/lib/billing/entitlements'

type Handler<TParams extends Record<string, string> = Record<string, never>> = (
  request: NextRequest,
  ctx: { session: AuthContext; params: TParams },
) => Promise<Response>

export function withFeature(feature: PlanFeatureKey) {
  return <TParams extends Record<string, string> = Record<string, never>>(
    handler: Handler<TParams>,
  ): Handler<TParams> =>
    async (request, ctx) => {
      if (!ctx.session.entitlements.features.includes(feature)) {
        return featureRequiredResponse(feature)
      }

      return handler(request, ctx)
    }
}
