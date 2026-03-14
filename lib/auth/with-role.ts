import type { NextRequest } from 'next/server'
import { fail } from '@/lib/api/response'
import type { UserRole } from '@/types'
import type { AuthContext } from './with-auth'

type Handler<TParams extends Record<string, string> = Record<string, never>> = (
  request: NextRequest,
  ctx: { session: AuthContext; params: TParams },
) => Promise<Response>

export function withRole(allowedRoles: UserRole[]) {
  return <TParams extends Record<string, string> = Record<string, never>>(
    handler: Handler<TParams>,
  ): Handler<TParams> =>
    async (request, ctx) => {
      if (!allowedRoles.includes(ctx.session.role)) {
        return fail(
          'FORBIDDEN',
          `Requires role: ${allowedRoles.join(' or ')}`,
          403,
        )
      }

      return handler(request, ctx)
    }
}
