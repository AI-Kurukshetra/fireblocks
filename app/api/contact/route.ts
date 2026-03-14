import { NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasSupabaseEnv } from '@/lib/supabase/shared'

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  company: z.string().trim().min(2).max(160),
  useCase: z.enum(['custody', 'treasury', 'compliance', 'partnership', 'other']),
  message: z.string().trim().min(20).max(2000),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = contactSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid contact request payload.',
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  const payload = parsed.data

  logger.info(
    {
      company: payload.company,
      email: payload.email,
      useCase: payload.useCase,
    },
    'Contact request received',
  )

  if (hasSupabaseEnv() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient()
      await admin.from('contact_requests').insert({
        name: payload.name,
        email: payload.email,
        company: payload.company,
        use_case: payload.useCase,
        message: payload.message,
      })
    } catch (error) {
      logger.warn(
        {
          error,
          email: payload.email,
        },
        'Failed to persist contact request',
      )
    }
  }

  return NextResponse.json({
    ok: true,
    message: 'Request received. The Fireblocks team will follow up shortly.',
  })
}
