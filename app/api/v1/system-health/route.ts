import { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SystemStatus } from '@/types'

export const GET = withAuth(async (_request: NextRequest, { session }) => {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('system_health')
    .select('component, status, updated_at')
    .eq('organization_id', session.orgId)
    .order('component', { ascending: true })

  if (error) {
    return fail('SYSTEM_HEALTH_FAILED', 'Failed to load system health', 500)
  }

  const systems: SystemStatus[] = (data ?? []).map((item) => ({
    component: item.component,
    status: item.status as SystemStatus['status'],
    lastChecked: item.updated_at,
  }))

  return ok(systems)
})
