import { z } from 'zod'

export const inviteUserSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().trim().toLowerCase(),
  role: z.enum(['admin', 'approver', 'analyst', 'viewer']),
})
