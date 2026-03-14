import { createHash, randomBytes } from 'crypto'

export function generateApiKey(): { plaintext: string; hash: string; prefix: string } {
  const secret = randomBytes(36).toString('base64url')
  const plaintext = `vos_live_sk_${secret}`
  const hash = createHash('sha256').update(plaintext).digest('hex')
  const prefix = plaintext.slice(0, 16)

  return { plaintext, hash, prefix }
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}
