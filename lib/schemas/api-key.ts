import { z } from 'zod'

export const createApiKeySchema = z.object({
  name: z.string().min(3).max(100).trim(),
  permissions: z.array(z.enum(['read', 'write', 'admin'])).min(1),
  expires_at: z.string().datetime().nullable().optional(),
})
