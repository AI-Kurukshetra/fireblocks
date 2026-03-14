import { z } from 'zod'

export const organizationSetupSchema = z.object({
  organization_name: z.string().trim().min(2),
  legal_name: z.string().trim().min(2),
  business_type: z.string().trim().min(2),
  registration_country: z.string().trim().min(2),
  registration_number: z.string().trim().min(2),
  tax_id: z.string().trim().min(2),
  website: z.string().trim().url(),
  phone: z.string().trim().min(7),
  billing_email: z.string().trim().email(),
  operations_email: z.string().trim().email(),
  compliance_email: z.string().trim().email(),
  address_line_1: z.string().trim().min(4),
  address_line_2: z.string().trim().optional().or(z.literal('')),
  city: z.string().trim().min(2),
  state_region: z.string().trim().min(2),
  postal_code: z.string().trim().min(2),
  country: z.string().trim().min(2),
  plan: z.enum(['starter', 'growth', 'enterprise']),
  billing_interval: z.enum(['monthly', 'annual']).default('monthly'),
})

export const organizationUpdateSchema = organizationSetupSchema.partial().extend({
  onboarding_status: z.enum(['pending_setup', 'billing_pending', 'complete']).optional(),
  subscription_status: z
    .enum(['pending', 'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'manual'])
    .optional(),
})
