import { createHmac, timingSafeEqual } from 'crypto'
import type { BillingInterval } from '@/types'
import type { PlanCatalogRecord } from '@/types'
import { getPlanPriceId } from './plan-config'

function requireStripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY')
  }

  return secretKey
}

export function hasStripeEnv() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_APP_URL)
}

function toStripeBody(params: Record<string, string | undefined | null>) {
  const body = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      body.append(key, value)
    }
  }

  return body
}

async function stripeRequest<T>(path: string, body: URLSearchParams) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireStripeSecretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const payload = (await response.json().catch(() => null)) as T | { error?: { message?: string } } | null

  if (!response.ok || !payload) {
    throw new Error(
      (payload as { error?: { message?: string } } | null)?.error?.message ??
        `Stripe request failed for ${path}`,
    )
  }

  return payload as T
}

async function stripeGet<T>(path: string, searchParams?: URLSearchParams) {
  const query = searchParams?.toString()
  const response = await fetch(`https://api.stripe.com/v1/${path}${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${requireStripeSecretKey()}`,
    },
  })

  const payload = (await response.json().catch(() => null)) as T | { error?: { message?: string } } | null

  if (!response.ok || !payload) {
    throw new Error(
      (payload as { error?: { message?: string } } | null)?.error?.message ??
        `Stripe request failed for ${path}`,
    )
  }

  return payload as T
}

export async function createOrUpdateStripeCustomer(input: {
  existingCustomerId?: string | null
  email: string
  name: string
  organizationId: string
}) {
  if (input.existingCustomerId) {
    return input.existingCustomerId
  }

  const customer = await stripeRequest<{ id: string }>(
    'customers',
    toStripeBody({
      email: input.email,
      name: input.name,
      'metadata[organization_id]': input.organizationId,
    }),
  )

  return customer.id
}

export async function createCheckoutSession(input: {
  customerId: string
  plan: PlanCatalogRecord
  billingInterval: BillingInterval
  organizationId: string
  successUrl: string
  cancelUrl: string
}) {
  const priceId = getPlanPriceId(input.plan, input.billingInterval)

  if (!priceId) {
    throw new Error(`Missing Stripe price id for ${input.plan.code} ${input.billingInterval}`)
  }

  const session = await stripeRequest<{ url: string }>(
    'checkout/sessions',
    toStripeBody({
      mode: 'subscription',
      customer: input.customerId,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'metadata[organization_id]': input.organizationId,
      'metadata[plan]': input.plan.code,
      'metadata[billing_interval]': input.billingInterval,
      'subscription_data[metadata][organization_id]': input.organizationId,
      'subscription_data[metadata][plan]': input.plan.code,
      'subscription_data[metadata][billing_interval]': input.billingInterval,
    }),
  )

  return session.url
}

export async function createPortalSession(input: {
  customerId: string
  returnUrl: string
}) {
  const session = await stripeRequest<{ url: string }>(
    'billing_portal/sessions',
    toStripeBody({
      customer: input.customerId,
      return_url: input.returnUrl,
    }),
  )

  return session.url
}

export async function retrieveCheckoutSession(sessionId: string) {
  return stripeGet<{
    id: string
    mode: string
    status: string | null
    payment_status: string | null
    customer: string | null
    subscription:
      | string
      | {
          id: string
          status?: string | null
          current_period_start?: number | null
          current_period_end?: number | null
          items?: {
            data?: Array<{
              price?: {
                recurring?: {
                  interval?: 'month' | 'year' | null
                } | null
              } | null
            }>
          } | null
        }
      | null
    metadata?: Record<string, string>
  }>(`checkout/sessions/${sessionId}`, new URLSearchParams([['expand[]', 'subscription']]))
}

export function verifyStripeSignature(payload: string, signatureHeader: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secret || !signatureHeader) {
    return false
  }

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.split('=')
      return [key, value]
    }),
  )

  const timestamp = parts.t
  const signature = parts.v1

  if (!timestamp || !signature) {
    return false
  }

  const signedPayload = `${timestamp}.${payload}`
  const computed = createHmac('sha256', secret).update(signedPayload).digest('hex')

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(computed))
  } catch {
    return false
  }
}
