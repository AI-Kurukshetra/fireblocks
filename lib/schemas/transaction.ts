import { z } from 'zod'

export const initiateTransactionSchema = z.object({
  from_vault: z.string().uuid(),
  asset_symbol: z.string().min(2).max(10).trim().toUpperCase(),
  amount: z.number().positive().finite(),
  amount_usd: z.number().positive().finite(),
  to_address: z.string().min(10).max(200),
  to_institution: z.string().trim().max(200).nullable().optional(),
  blockchain: z.enum(['bitcoin', 'ethereum', 'solana', 'polygon', 'arbitrum']),
})

export const approvalActionSchema = z.object({
  comment: z.string().trim().max(1000).optional(),
})
