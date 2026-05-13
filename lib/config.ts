// Order de priorite :
// 1. NEXT_PUBLIC_APP_URL (set explicitement en prod sur Vercel → https://izou.fr)
// 2. VERCEL_URL (auto-set par Vercel pour les preview deploys → https://fidelizy-xxx.vercel.app)
// 3. Fallback `https://izou.fr` (prod domain definitif)
export const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://izou.fr')

export function cardUrl(qrCodeId: string): string {
  return `${BASE_URL}/card/${qrCodeId}`
}

export function joinUrl(shortCode: string): string {
  return `${BASE_URL}/join/${shortCode}`
}
