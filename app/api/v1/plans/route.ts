import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { withAuth } from '@/lib/auth/with-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_PLAN_CATALOG, normalizePlanCatalogRecord } from '@/lib/billing/plan-config'
import type { Database } from '@/types/database'
import type { PlanCatalogRecord } from '@/types'

export const GET = withAuth(async (_request: NextRequest) => {
  const admin = createAdminClient()
  const { data } = await admin.from('plan_catalog').select('*').order('monthly_price_usd', { ascending: true })
  const normalized = ((data ?? []) as Database['public']['Tables']['plan_catalog']['Row'][])
    .map((row) => normalizePlanCatalogRecord(row))
    .filter((row): row is PlanCatalogRecord => Boolean(row))

  return ok(normalized.length ? normalized : Object.values(DEFAULT_PLAN_CATALOG))
})
