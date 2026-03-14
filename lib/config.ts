export const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://fidelizy.vercel.app')

export function cardUrl(qrCodeId: string): string {
  return `${BASE_URL}/card/${qrCodeId}`
}

export function joinUrl(shortCode: string): string {
  return `${BASE_URL}/join/${shortCode}`
}
