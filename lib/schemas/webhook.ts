import { z } from 'zod'

const webhookEvents = [
  'transaction.created',
  'transaction.approved',
  'transaction.rejected',
  'transaction.completed',
  'vault.created',
  'vault.updated',
  'compliance.flagged',
  'approval.required',
] as const

export const createWebhookSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  url: z.string().url().startsWith('https://'),
  events: z.array(z.enum(webhookEvents)).min(1),
})
