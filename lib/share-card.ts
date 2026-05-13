/**
 * Generation d'une image "fiche partage" pour les commerces — destinee aux
 * stories Instagram, posts sociaux et partages directs.
 *
 * Formats :
 *   - 'post'  (default) : 1080x1350 Instagram portrait 4:5
 *   - 'story'           : 1080x1920 Instagram story 9:16
 *
 * Layout :
 *   [bannière commerce cover]
 *   [logo merchant overlay bottom-left de la bannière]
 *   [nom commerce + description sur fond clair]
 *   [coordonnees avec icones SVG inline (adresse, telephone, web)]
 *   [QR code centre + URL inscription + branding IZOU]
 *
 * Polices : Inter (Regular + Bold) EMBEDDED en base64 dans le SVG via
 * @font-face inline. Resout le bug de "boxes/hieroglyphes" qu'on avait
 * avec Arial,sans-serif (font introuvable sur Vercel serverless Linux).
 */

import sharp from 'sharp'
import QRCode from 'qrcode'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getPublicAsset } from '@/lib/assets'

// ── Font loading (module-level — cache au cold start) ─────────────────────────

const FONTS_DIR = join(process.cwd(), 'lib', 'fonts')

// Lecture des TTF + encodage base64 fait une seule fois au boot de la lambda.
// Les buffers restent en memoire — re-utilises par chaque request (warm).
const FONT_REGULAR_B64 = readFileSync(join(FONTS_DIR, 'Inter-Regular.ttf')).toString('base64')
const FONT_BOLD_B64 = readFileSync(join(FONTS_DIR, 'Inter-Bold.ttf')).toString('base64')

/** @font-face defs a injecter dans <defs> du SVG. librsvg supporte
 *  les data: URLs depuis 2.40 (version Vercel serverless OK). */
const FONT_FACE_DEFS = `<style type="text/css">
@font-face {
  font-family: 'Inter';
  font-weight: 400;
  font-style: normal;
  src: url(data:font/ttf;base64,${FONT_REGULAR_B64}) format('truetype');
}
@font-face {
  font-family: 'Inter';
  font-weight: 700;
  font-style: normal;
  src: url(data:font/ttf;base64,${FONT_BOLD_B64}) format('truetype');
}
</style>`

const FONT_FAMILY = 'Inter,sans-serif'

// ── Types + constantes ────────────────────────────────────────────────────────

export type ShareCardFormat = 'post' | 'story'

export interface ShareCardOptions {
  businessName: string
  description: string | null
  logoUrl: string | null
  bannerUrl: string | null
  address: string | null
  phone: string | null
  website: string | null
  inscriptionUrl: string
  /** Code parrainage (PRENOM-XXXX). Si fourni, ajoute au QR. */
  referralCode?: string | null
  /** Format de sortie. Default : 'post' (1080x1350). 'story' : 1080x1920. */
  format?: ShareCardFormat
}

const FALLBACK_BANNER_URL = getPublicAsset('cards/loyalty-card-default.webp')

// Wordmark Izou noir pour branding bas (sur fond blanc)
const IZOU_WORDMARK_SVG_BLACK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56.6215 16.6021" fill="#1E1E1E"><path d="M47.409 16.6021C46.1894 16.6021 45.1088 16.3378 44.1673 15.8091C43.2473 15.2592 42.5198 14.4873 41.9848 13.4934C41.4713 12.4994 41.2145 11.3469 41.2145 10.0357V0.646059H44.9697V9.75022C44.9697 10.9979 45.28 11.9285 45.9005 12.5417C46.521 13.155 47.409 13.4617 48.5645 13.4617C49.8483 13.4617 50.8539 13.0387 51.5815 12.1928C52.3304 11.3469 52.7048 10.152 52.7048 8.60824V0.646059H56.46L56.6215 16.5698H52.9305L52.769 14.1913H52.2234C51.9452 14.7411 51.4424 15.2804 50.7149 15.8091C49.9874 16.3378 48.8854 16.6021 47.409 16.6021Z"/><path d="M30.5074 16.6021C28.8923 16.6021 27.441 16.2846 26.1533 15.6498C24.8875 15.0149 23.8836 14.0943 23.1415 12.888C22.3995 11.6818 22.0285 10.2321 22.0285 8.53913V8.06297C22.0285 6.39112 22.3995 4.95207 23.1415 3.7458C23.8836 2.53953 24.8875 1.61896 26.1533 0.984078C27.441 0.328038 28.8923 1.7643e-05 30.5074 1.7643e-05C32.1224 1.7643e-05 33.5628 0.328038 34.8287 0.984078C36.1163 1.61896 37.1203 2.53953 37.8405 3.7458C38.5825 4.95207 38.9535 6.39112 38.9535 8.06297V8.53913C38.9535 10.2321 38.5825 11.6818 37.8405 12.888C37.1203 14.0943 36.1163 15.0149 34.8287 15.6498C33.5628 16.2846 32.1224 16.6021 30.5074 16.6021ZM30.5074 13.3007C31.8387 13.3007 32.9408 12.8775 33.8138 12.031C34.6868 11.1845 35.1233 9.99935 35.1233 8.47564V8.1582C35.1233 6.61333 34.6868 5.41764 33.8138 4.57114C32.9627 3.72464 31.8605 3.30138 30.5074 3.30138C29.1542 3.30138 28.0412 3.72464 27.1682 4.57114C26.2952 5.41764 25.8587 6.61333 25.8587 8.1582V8.47564C25.8587 9.99935 26.2952 11.1845 27.1682 12.031C28.0412 12.8775 29.1542 13.3007 30.5074 13.3007Z"/><path d="M6.78301 16.6021V12.0571L15.5123 4.28856V3.80504H7.09589V0.646059H19.5172V5.19112L10.7566 12.9919V13.4754H19.7675V16.6021H6.78301Z"/><path d="M0 16.6021V0.646059H3.94057V16.6021H0Z"/></svg>`

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!
  )
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars) {
      if (line) lines.push(line)
      line = w
    } else {
      line = (line + ' ' + w).trim()
    }
  }
  if (line) lines.push(line)
  return lines
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

export async function buildShareCard(opts: ShareCardOptions): Promise<Buffer> {
  const format: ShareCardFormat = opts.format === 'story' ? 'story' : 'post'
  const WIDTH = 1080
  const HEIGHT = format === 'story' ? 1920 : 1350
  // En mode story, on aere : banniere un peu plus haute + bloc texte plus
  // d'espace, QR plus bas.
  const BANNER_HEIGHT = format === 'story' ? 700 : 540

  // 1. Background blanc plein cadre.
  const base = await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .png()
    .toBuffer()

  // 2. Bannière (banner_url ou card_image_url ou fallback)
  const bannerUrl = opts.bannerUrl || FALLBACK_BANNER_URL
  const bannerSrc = await fetchImageBuffer(bannerUrl)
  let bannerBuf: Buffer
  if (bannerSrc) {
    bannerBuf = await sharp(bannerSrc)
      .resize({ width: WIDTH, height: BANNER_HEIGHT, fit: 'cover', position: 'center' })
      .png()
      .toBuffer()
  } else {
    bannerBuf = await sharp({
      create: { width: WIDTH, height: BANNER_HEIGHT, channels: 4, background: { r: 30, g: 30, b: 30, alpha: 1 } },
    })
      .png()
      .toBuffer()
  }

  // 3. Logo merchant (carre 200x200, overlay bottom-left)
  let logoSquare: Buffer | null = null
  if (opts.logoUrl) {
    const logoSrc = await fetchImageBuffer(opts.logoUrl)
    if (logoSrc) {
      const frameSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" rx="28" fill="white"/></svg>`
      const frameBuf = await sharp(Buffer.from(frameSvg)).png().toBuffer()
      const logoFitted = await sharp(logoSrc)
        .resize({ width: 150, height: 150, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toBuffer()
      logoSquare = await sharp(frameBuf)
        .composite([{ input: logoFitted, gravity: 'center' }])
        .png()
        .toBuffer()
    }
  }

  // 4. QR code (300x300) avec URL inscription (+ ref code si fourni)
  const qrUrl = opts.referralCode
    ? `${opts.inscriptionUrl}?ref=${encodeURIComponent(opts.referralCode)}`
    : opts.inscriptionUrl
  const qrBuffer = await QRCode.toBuffer(qrUrl, {
    width: 320,
    margin: 0,
    color: { dark: '#1E1E1E', light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  })

  // 5. Wordmark Izou pour branding bottom-right
  const izouWordmark = await sharp(Buffer.from(IZOU_WORDMARK_SVG_BLACK))
    .resize({ width: 110, height: 32, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer()

  // 6. SVG textuel principal (nom, description, coords, URL)
  const businessName = escapeXml(opts.businessName)
  const descLines = wrapText(escapeXml(opts.description || ''), 40).slice(0, 3)
  const addressLines = opts.address ? wrapText(escapeXml(opts.address), 38).slice(0, 2) : []
  const phone = opts.phone ? escapeXml(opts.phone) : null
  const website = opts.website
    ? escapeXml(opts.website.replace(/^https?:\/\//, '').replace(/\/$/, ''))
    : null

  const hasLogo = logoSquare !== null
  const textStartX = hasLogo ? 290 : 60
  const textStartY = BANNER_HEIGHT + 120 // sous la banniere + padding pour overlap logo

  // Icones SVG inline (path simples)
  const iconPin = `<path d="M 0 8 C 0 3.6 3.6 0 8 0 C 12.4 0 16 3.6 16 8 C 16 14 8 20 8 20 C 8 20 0 14 0 8 Z M 8 11 C 9.7 11 11 9.7 11 8 C 11 6.3 9.7 5 8 5 C 6.3 5 5 6.3 5 8 C 5 9.7 6.3 11 8 11 Z" fill="#666"/>`
  const iconPhone = `<path d="M 4 0 L 6 0 L 8 5 L 6 6 C 7 8 9 10 11 11 L 12 9 L 17 11 L 17 13 C 17 15 15 17 13 17 C 6 17 0 11 0 4 C 0 2 2 0 4 0 Z" fill="#666"/>`
  const iconGlobe = `<circle cx="9" cy="9" r="9" fill="none" stroke="#666" stroke-width="1.5"/><line x1="0" y1="9" x2="18" y2="9" stroke="#666" stroke-width="1.5"/><path d="M 9 0 C 5 4 5 14 9 18 M 9 0 C 13 4 13 14 9 18" fill="none" stroke="#666" stroke-width="1.5"/>`

  let coordsY = textStartY + 60 + (descLines.length * 40)
  const coordsBlock: string[] = []
  if (addressLines.length > 0) {
    coordsBlock.push(
      `<g transform="translate(60 ${coordsY})"><g transform="translate(0 8)">${iconPin}</g><text x="40" y="22" font-family="${FONT_FAMILY}" font-weight="400" font-size="28" fill="#333">${addressLines[0]}</text></g>`,
    )
    coordsY += 50
    if (addressLines[1]) {
      coordsBlock.push(
        `<text x="100" y="${coordsY}" font-family="${FONT_FAMILY}" font-weight="400" font-size="28" fill="#333">${addressLines[1]}</text>`,
      )
      coordsY += 50
    }
  }
  if (phone) {
    coordsBlock.push(
      `<g transform="translate(60 ${coordsY})"><g transform="translate(0 8)">${iconPhone}</g><text x="40" y="22" font-family="${FONT_FAMILY}" font-weight="400" font-size="28" fill="#333">${phone}</text></g>`,
    )
    coordsY += 50
  }
  if (website) {
    coordsBlock.push(
      `<g transform="translate(60 ${coordsY})"><g transform="translate(0 8)">${iconGlobe}</g><text x="40" y="22" font-family="${FONT_FAMILY}" font-weight="400" font-size="28" fill="#333">${website}</text></g>`,
    )
    coordsY += 50
  }

  // Position QR : sous les coords (avec padding), au moins a 380px du bas pour
  // laisser de la place a "Scannez..." + wordmark Izou.
  const qrSize = 320
  const qrTop = Math.max(coordsY + 40, HEIGHT - 480)
  const qrLeft = Math.round((WIDTH - qrSize) / 2)

  // CTA "Scannez pour rejoindre" au-dessus du QR
  const scanCtaY = qrTop - 20

  const overlaySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    <defs>${FONT_FACE_DEFS}</defs>
    <text x="${textStartX}" y="${textStartY}" font-family="${FONT_FAMILY}" font-weight="700" font-size="60" fill="#1E1E1E">${businessName}</text>
    ${descLines.map((l, i) => `<text x="${textStartX}" y="${textStartY + 56 + i * 38}" font-family="${FONT_FAMILY}" font-weight="400" font-size="28" fill="#666">${l}</text>`).join('')}
    ${coordsBlock.join('')}
    <text x="${WIDTH / 2}" y="${scanCtaY}" font-family="${FONT_FAMILY}" font-weight="600" font-size="26" fill="#1E1E1E" text-anchor="middle">Scannez pour rejoindre le programme</text>
  </svg>`

  // 7. Composition finale
  const composites: { input: Buffer; top?: number; left?: number; gravity?: string }[] = [
    { input: bannerBuf, top: 0, left: 0 },
  ]
  if (logoSquare) {
    composites.push({ input: logoSquare, top: BANNER_HEIGHT - 80, left: 60 })
  }
  composites.push({ input: Buffer.from(overlaySvg), top: 0, left: 0 })
  // QR centre, position calculee
  composites.push({ input: qrBuffer, top: qrTop, left: qrLeft })
  // Wordmark Izou bottom-right
  composites.push({ input: izouWordmark, top: HEIGHT - 56, left: WIDTH - 130 })

  return await sharp(base).composite(composites).png({ compressionLevel: 9 }).toBuffer()
}
