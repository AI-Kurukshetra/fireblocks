import { z } from 'zod'

export const riskProfileSchema = z.object({
  risk_score: z.number().int().min(0).max(100),
  max_single_tx_usd: z.number().positive(),
  restricted_countries: z.array(z.string().trim()).default([]),
  restricted_assets: z.array(z.string().trim()).default([]),
  approval_escalation_enabled: z.boolean().default(true),
  screening_provider: z.string().trim().optional().or(z.literal('')),
})
