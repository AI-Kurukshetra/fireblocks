import { createHmac, timingSafeEqual } from 'crypto'

export function signWebhookPayload(secret: string, payload: string, timestamp: number) {
  return createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex')
}

export function verifyWebhookSignature(
  secret: string,
  payload: string,
  timestamp: number,
  signature: string,
  toleranceSeconds = 300,
) {
  const now = Math.floor(Date.now() / 1000)

  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return false
  }

  const expected = signWebhookPayload(secret, payload, timestamp)

  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}
