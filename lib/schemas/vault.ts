import { z } from 'zod'

const blockchainNetworks = [
  'bitcoin',
  'ethereum',
  'solana',
  'polygon',
  'arbitrum',
] as const

const vaultSchemaBase = z.object({
  name: z.string().min(3).max(100).trim(),
  type: z.enum(['hot', 'warm', 'cold']),
  signatories_required: z.number().int().min(1).max(7),
  total_signatories: z.number().int().min(1).max(10),
  blockchain_networks: z.array(z.enum(blockchainNetworks)).min(1),
})

export const createVaultSchema = vaultSchemaBase
  .refine((input) => input.signatories_required <= input.total_signatories, {
    message: 'signatories_required must be less than or equal to total_signatories',
    path: ['signatories_required'],
  })

export const updateVaultSchema = vaultSchemaBase.partial().extend({
  status: z.enum(['active', 'locked', 'archived']).optional(),
})
