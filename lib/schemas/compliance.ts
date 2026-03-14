import { z } from 'zod'

export const createComplianceSchema = z.object({
  institution_name: z.string().min(3).max(160).trim(),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']),
  aml_status: z.enum(['passed', 'under_review', 'flagged', 'failed']),
  kyc_status: z.enum(['pending', 'verified', 'rejected']),
  compliance_score: z.number().int().min(0).max(100),
  flagged_transactions: z.number().int().min(0).default(0),
  last_review: z.string().datetime(),
  next_review: z.string().datetime(),
})

export const updateComplianceSchema = createComplianceSchema.partial()
