import { createHmac, timingSafeEqual } from 'node:crypto'

const SECRET = process.env.WALLET_AUTH_SECRET!

export function generateCardToken(qrCodeId: string): string {
  return createHmac('sha256', SECRET)
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
