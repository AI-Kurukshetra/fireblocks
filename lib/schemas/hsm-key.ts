import { z } from 'zod'

export const createHsmKeySchema = z.object({
  vault_id: z.string().uuid().nullable().optional(),
  provider: z.string().trim().min(2),
  label: z.string().trim().min(2),
  environment: z.string().trim().min(2).default('production'),
  key_reference: z.string().trim().min(4),
  assigned_policy: z.string().trim().optional().or(z.literal('')),
  next_rotation_due: z.string().datetime().nullable().optional(),
})
