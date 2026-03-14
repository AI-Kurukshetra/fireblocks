import { NextRequest } from 'next/server'
import { fail, ok } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const GET = withAuth(async (_request: NextRequest, { session }) => {
  const admin = createAdminClient()
  const { data: transactions, error } = await admin
    .from('transactions')
    .select('created_at')
    .eq('organization_id', session.orgId)

  if (error) {
    return fail('ANALYTICS_ACTIVITY_FAILED', 'Failed to load activity analytics', 500)
  }

  const heatmap = new Map<string, number>()

  for (const transaction of transactions ?? []) {
    const createdAt = new Date(transaction.created_at)
    const bucket = `${createdAt.getUTCDay()}-${createdAt.getUTCHours()}`
    heatmap.set(bucket, (heatmap.get(bucket) ?? 0) + 1)
  }

  return ok(
    Array.from(heatmap.entries()).map(([bucket, count]) => {
      const [day, hour] = bucket.split('-')
      return {
        day: Number(day),
        hour: Number(hour),
        count,
      }
    }),
  )
})
