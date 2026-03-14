import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'

export const GET = withAuth(async (_request: NextRequest, { session }) => {
  return ok(session)
})
