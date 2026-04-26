/**
 * Generation client-side du QR code de jonction d'un commerce + declenchement download.
 * Utilise la lib `qrcode` (dans package.json).
 * Pas de roundtrip serveur : encode l'URL `/join/{shortCode}` en PNG 1024px.
 */

import QRCode from 'qrcode'

export interface QRDownloadOptions {
  /** Code court unique du commerce (ex: 'AB3X7K'). */
  shortCode: string
  /** Nom du commerce (utilise pour le filename). */
  businessName: string
  /** Origine du site (ex: window.location.origin). */
  origin: string
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'commerce'
}

export async function downloadQRCode({ shortCode, businessName, origin }: QRDownloadOptions): Promise<void> {
  const joinUrl = `${origin}/join/${shortCode}`

  const dataUrl = await QRCode.toDataURL(joinUrl, {
    width: 1024,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#7F56D9',
      light: '#FFFFFF',
    },
  })

  const link = document.createElement('a')
  link.download = `qr-izou-${slugify(businessName)}.png`
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
