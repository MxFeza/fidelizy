import { createHmac, timingSafeEqual } from 'node:crypto'

function getSecret(): string {
  const secret = process.env.WALLET_AUTH_SECRET
  if (!secret) throw new Error('WALLET_AUTH_SECRET is not configured')
  return secret
}

export function generateCardToken(qrCodeId: string): string {
  return createHmac('sha256', getSecret())
    .update(`card:${qrCodeId}`)
    .digest('hex')
}

export function verifyCardToken(token: string, qrCodeId: string): boolean {
  try {
    const expected = Buffer.from(generateCardToken(qrCodeId))
    const received = Buffer.from(token)
    if (expected.length !== received.length) return false
    return timingSafeEqual(expected, received)
  } catch {
    return false
  }
}
