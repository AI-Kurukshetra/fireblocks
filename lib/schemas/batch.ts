import { z } from 'zod'

export const batchTransactionSchema = z.object({
  name: z.string().trim().min(2),
  asset_symbol: z.string().trim().min(2),
  blockchain: z.string().trim().min(2),
  approvals_required: z.number().int().min(1).max(5).default(2),
  items: z
    .array(
      z.object({
        to_address: z.string().trim().min(8),
        to_institution: z.string().trim().optional().or(z.literal('')),
        amount: z.number().positive(),
        amount_usd: z.number().positive(),
      }),
    )
    .min(1),
})
