// Order de priorite :
// 1. NEXT_PUBLIC_APP_URL (set explicitement en prod sur Vercel → https://www.izou.fr)
// 2. VERCEL_URL (auto-set par Vercel pour les preview deploys → https://fidelizy-xxx.vercel.app)
// 3. Fallback `https://www.izou.fr` (prod domain definitif)
//
// IMPORTANT — Apple Wallet (Pass Type ID web service) : le pkpass embed
// `webServiceURL = ${BASE_URL}/api/wallet`. Si NEXT_PUBLIC_APP_URL n'est pas
// set en prod, Apple recoit un VERCEL_URL dynamique (different a chaque
// deploy) → impossible d'enregistrer le device → 0 sync wallet. Set
// 2026-05-22 (bug retour user). NE PAS RETIRER cette env var sans plan
// de migration des pass deja en circulation.
export const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://www.izou.fr')

export function cardUrl(qrCodeId: string): string {
  return `${BASE_URL}/card/${qrCodeId}`
}

export function joinUrl(shortCode: string): string {
  return `${BASE_URL}/join/${shortCode}`
}
