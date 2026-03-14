import { z } from 'zod'

export const insurancePolicySchema = z.object({
  provider_name: z.string().trim().min(2),
  policy_number: z.string().trim().min(2),
  status: z.enum(['active', 'pending', 'expired']).default('pending'),
  coverage_limit_usd: z.number().nonnegative(),
  deductible_usd: z.number().nonnegative(),
  covered_assets: z.array(z.string().trim()).default([]),
  renewal_at: z.string().datetime().nullable().optional(),
  notes: z.string().trim().optional().or(z.literal('')),
})
