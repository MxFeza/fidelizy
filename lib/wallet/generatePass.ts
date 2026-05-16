import { createServiceClient } from '@/lib/supabase/service'
import { createHmac, createHash, timingSafeEqual } from 'node:crypto'
import sharp from 'sharp'
import JSZip from 'jszip'
import forge from 'node-forge'

const PASS_TYPE_ID = process.env.APPLE_PASS_TYPE_ID!
const TEAM_ID = process.env.APPLE_TEAM_ID!
import { BASE_URL } from '@/lib/config'

// ── Auth token ────────────────────────────────────────────────────────────────

export function generateAuthToken(qrCodeId: string): string {
  return createHmac('sha256', process.env.WALLET_AUTH_SECRET!)
    .update(qrCodeId)
    .digest('hex')
}

export function verifyAuthToken(token: string, qrCodeId: string): boolean {
  try {
    const expected = Buffer.from(generateAuthToken(qrCodeId))
    const received = Buffer.from(token)
    if (expected.length !== received.length) return false
    return timingSafeEqual(expected, received)
  } catch {
    return false
  }
}

// ── Image helpers (Sharp pour vrais assets) ───────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.startsWith('#') ? hex.slice(1) : hex
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** Wordmark Izou en SVG inline, blanc. ViewBox 56.6 x 16.6 (~3.4:1). */
const IZOU_WORDMARK_SVG_WHITE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56.6215 16.6021" fill="#ffffff"><path d="M47.409 16.6021C46.1894 16.6021 45.1088 16.3378 44.1673 15.8091C43.2473 15.2592 42.5198 14.4873 41.9848 13.4934C41.4713 12.4994 41.2145 11.3469 41.2145 10.0357V0.646059H44.9697V9.75022C44.9697 10.9979 45.28 11.9285 45.9005 12.5417C46.521 13.155 47.409 13.4617 48.5645 13.4617C49.8483 13.4617 50.8539 13.0387 51.5815 12.1928C52.3304 11.3469 52.7048 10.152 52.7048 8.60824V0.646059H56.46L56.6215 16.5698H52.9305L52.769 14.1913H52.2234C51.9452 14.7411 51.4424 15.2804 50.7149 15.8091C49.9874 16.3378 48.8854 16.6021 47.409 16.6021Z"/><path d="M30.5074 16.6021C28.8923 16.6021 27.441 16.2846 26.1533 15.6498C24.8875 15.0149 23.8836 14.0943 23.1415 12.888C22.3995 11.6818 22.0285 10.2321 22.0285 8.53913V8.06297C22.0285 6.39112 22.3995 4.95207 23.1415 3.7458C23.8836 2.53953 24.8875 1.61896 26.1533 0.984078C27.441 0.328038 28.8923 1.7643e-05 30.5074 1.7643e-05C32.1224 1.7643e-05 33.5628 0.328038 34.8287 0.984078C36.1163 1.61896 37.1203 2.53953 37.8405 3.7458C38.5825 4.95207 38.9535 6.39112 38.9535 8.06297V8.53913C38.9535 10.2321 38.5825 11.6818 37.8405 12.888C37.1203 14.0943 36.1163 15.0149 34.8287 15.6498C33.5628 16.2846 32.1224 16.6021 30.5074 16.6021ZM30.5074 13.3007C31.8387 13.3007 32.9408 12.8775 33.8138 12.031C34.6868 11.1845 35.1233 9.99935 35.1233 8.47564V8.1582C35.1233 6.61333 34.6868 5.41764 33.8138 4.57114C32.9627 3.72464 31.8605 3.30138 30.5074 3.30138C29.1542 3.30138 28.0412 3.72464 27.1682 4.57114C26.2952 5.41764 25.8587 6.61333 25.8587 8.1582V8.47564C25.8587 9.99935 26.2952 11.1845 27.1682 12.031C28.0412 12.8775 29.1542 13.3007 30.5074 13.3007Z"/><path d="M6.78301 16.6021V12.0571L15.5123 4.28856V3.80504H7.09589V0.646059H19.5172V5.19112L10.7566 12.9919V13.4754H19.7675V16.6021H6.78301Z"/><path d="M0 16.6021V0.646059H3.94057V16.6021H0Z"/></svg>`

/** Logo pour le pkpass — priorise le logo MERCHANT (business.logo_url) pour
 *  que chaque carte ait son propre logo en haut. Fallback : wordmark Izou
 *  blanc inline. Canvas avec padding transparent pour rendre visuellement
 *  petit dans le rendu Apple Wallet (qui scale en hauteur).
 *
 *  Apple Wallet logo recommande : 160x50 @1x. On vise 240x70 @2x.
 *  Le logo merchant est fit-contain dans un cadre 200x60 centre dans 240x70
 *  → ~60px de hauteur effective dans le pass apres scale Apple.
 */
async function generateLogoPng(
  width: number,
  height: number,
  merchantLogoUrl: string | null,
): Promise<Buffer> {
  // Tente le logo merchant en premier
  if (merchantLogoUrl) {
    try {
      const res = await fetch(merchantLogoUrl, { cache: 'no-store' })
      if (res.ok) {
        const inputBuf: Buffer = Buffer.from(await res.arrayBuffer())
        // Cadre interne plus petit pour donner un peu de padding visuel
        const inner = await sharp(inputBuf)
          .resize({
            width: Math.round(width * 0.85),
            height: Math.round(height * 0.85),
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer()
        return await sharp({
          create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
        })
          .composite([{ input: inner, gravity: 'west' }])
          .png()
          .toBuffer()
      }
    } catch (e) {
      console.warn('[wallet] merchant logo fetch failed, fallback Izou', e)
    }
  }
  // Fallback : wordmark Izou blanc
  return sharp(Buffer.from(IZOU_WORDMARK_SVG_WHITE))
    .resize({
      width: Math.round(width * 0.7),
      height: Math.round(height * 0.7),
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: Math.round(height * 0.15),
      bottom: Math.round(height * 0.15),
      left: Math.round(width * 0.05),
      right: Math.round(width * 0.25),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize({ width, height, fit: 'fill' })
    .png()
    .toBuffer()
}

/** Icon (logomark Izou simplifie pour notifications). 29x29 / 58x58. */
const IZOU_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1E1E1E"/><path d="M28 38l-7-7-3 3 10 10 18-18-3-3z" fill="#ffffff"/></svg>`

async function generateIconPng(size: number): Promise<Buffer> {
  return sharp(Buffer.from(IZOU_ICON_SVG))
    .resize({ width: size, height: size })
    .png()
    .toBuffer()
}

/**
 * SVG TRANSPARENT contenant uniquement la grille de tampons.
 * Pas de fond, pas de texte (le compteur va dans un pkpass field natif —
 * evite les problemes de police corrompue sur serverless).
 *
 * Layout : 2 rangees max, cercles plus gros (radius cape a 55px) pour
 * lisibilite Apple Wallet a echelle reelle (~375px de large rendered).
 *   - filled  : cercle blanc + checkmark dark au centre
 *   - unfilled: cercle semi-transparent noir + border blanche
 *               (le bg semi-transparent assure visibilite sur l'image
 *               commerce darkenee derriere).
 */
function buildStampsGridSvg(
  width: number,
  height: number,
  stampsRequired: number,
  stampsCount: number,
): string {
  const cols = stampsRequired <= 5 ? stampsRequired : Math.ceil(stampsRequired / 2)
  const rows = Math.ceil(stampsRequired / cols)
  const padX = 60
  const padY = 30
  const gridW = width - padX * 2
  const gridH = height - padY * 2
  const cellW = gridW / cols
  const cellH = gridH / rows
  const cellSize = Math.min(cellW, cellH)
  // Cape a 55px pour eviter cercles geants quand stampsRequired faible (3-4).
  const radius = Math.min(cellSize * 0.42, 55)

  let cells = ''
  for (let i = 0; i < stampsRequired; i++) {
    const r = Math.floor(i / cols)
    const c = i % cols
    const cx = padX + cellW * c + cellW / 2
    const cy = padY + cellH * r + cellH / 2
    const filled = i < stampsCount
    if (filled) {
      cells += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#ffffff"/>`
      // Checkmark dark au centre (path simple)
      const cm = radius * 0.55
      const strokeW = Math.max(3, radius * 0.18)
      cells += `<path d="M ${cx - cm * 0.6} ${cy + cm * 0.05} l ${cm * 0.5} ${cm * 0.45} l ${cm * 1.05} -${cm * 0.95}" stroke="#1E1E1E" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
    } else {
      // Fond semi-transparent + border blanche pour rester visible sur image
      cells += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="rgba(0,0,0,0.35)" stroke="#ffffff" stroke-opacity="0.55" stroke-width="${Math.max(2, radius * 0.07)}"/>`
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${cells}</svg>`
}

/**
 * Composite strip image v3 (refonte 2026-05-13 — retour user) :
 *   - Background : image commerce DARKENED (brightness 0.42) → garde l'identite
 *     unique de chaque commerce sans masquer la grille de tampons.
 *   - Overlay : grille de tampons (mode stamps) ou rien (mode points).
 *   - PAS de texte counter dans le SVG (font corruption sur serverless).
 *     Le counter "12/12 TAMPONS" est dans un pkpass field natif a la place.
 *
 * Apple Wallet strip dimensions : 375x144 @1x, 750x288 @2x pour storeCard QR.
 *
 * Si le fetch image echoue : fallback fond noir uni + grille (toujours
 * exploitable). La fonction ne retourne jamais null pour le mode stamps.
 */
async function generateCompositeStrip(
  imageUrl: string | null,
  width: number,
  height: number,
  stampsRequired: number,
  stampsCount: number,
  isStamps: boolean,
): Promise<Buffer | null> {
  try {
    // Base : image merchant darkenee OU fond noir DS Izou.
    let baseBuf: Buffer
    let imageFetched = false

    if (imageUrl) {
      try {
        const res = await fetch(imageUrl, { cache: 'no-store' })
        if (res.ok) {
          const inputBuf: Buffer = Buffer.from(await res.arrayBuffer())
          baseBuf = await sharp(inputBuf)
            .resize({ width, height, fit: 'cover', position: 'center' })
            .modulate({ brightness: 0.42 }) // assombrit pour visibilite grille
            .png()
            .toBuffer()
          imageFetched = true
        } else {
          throw new Error(`status ${res.status}`)
        }
      } catch (e) {
        console.warn('[wallet] strip image fetch failed, fallback solid bg', e)
      }
    }

    if (!imageFetched) {
      baseBuf = await sharp({
        create: { width, height, channels: 4, background: { r: 30, g: 30, b: 30, alpha: 1 } },
      })
        .png()
        .toBuffer()
    }

    // Mode points : juste l'image darkenee sans grille (le counter "X pts"
    // est dans un primaryField natif).
    if (!isStamps) return baseBuf!

    // Mode stamps : grille SVG transparente compositee sur la base.
    const gridSvg = buildStampsGridSvg(width, height, stampsRequired, stampsCount)
    const gridBuf = await sharp(Buffer.from(gridSvg)).png().toBuffer()

    return await sharp(baseBuf!)
      .composite([{ input: gridBuf, top: 0, left: 0 }])
      .png()
      .toBuffer()
  } catch (e) {
    console.error('[wallet] composite strip generation failed', e)
    return null
  }
}

// ── PKCS7 signing ─────────────────────────────────────────────────────────────

function signManifest(keyPem: string, certPem: string, wwdrPem: string, manifest: string): Buffer {
  const p7 = forge.pkcs7.createSignedData()
  p7.content = forge.util.createBuffer(manifest, 'raw')
  const signerCert = forge.pki.certificateFromPem(certPem)
  const signerKey = forge.pki.privateKeyFromPem(keyPem)
  const wwdrCert = forge.pki.certificateFromPem(wwdrPem)
  p7.addCertificate(signerCert)
  p7.addCertificate(wwdrCert)
  p7.addSigner({
    key: signerKey,
    certificate: signerCert,
    digestAlgorithm: forge.pki.oids.sha1,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime },
    ],
  })
  p7.sign()
  const asn1 = p7.toAsn1()
  type Asn1 = forge.asn1.Asn1
  const v = (n: Asn1) => n.value as Asn1[]
  const signedData = v(v(asn1)[1])[0]
  const encapContentInfo = v(signedData)[2]
  if (v(encapContentInfo).length > 1) v(encapContentInfo).splice(1, 1)
  return Buffer.from(forge.asn1.toDer(asn1).getBytes(), 'binary')
}

// ── Pending action cache ──────────────────────────────────────────────────────

export type WalletAction = 'add' | 'deduct' | 'reset' | 'claim-reward' | null

interface PendingAction {
  action: WalletAction
  remainingForReward?: number
  expiresAt: number
}

const pendingActions = new Map<string, PendingAction>()

export function setPendingWalletAction(
  qrCodeId: string,
  action: WalletAction,
  remainingForReward?: number,
) {
  pendingActions.set(qrCodeId, {
    action,
    remainingForReward,
    expiresAt: Date.now() + 30_000,
  })
}

export function consumePendingAction(qrCodeId: string): PendingAction | null {
  const entry = pendingActions.get(qrCodeId)
  if (!entry) return null
  pendingActions.delete(qrCodeId)
  if (Date.now() > entry.expiresAt) return null
  return entry
}

// ── changeMessage helpers ─────────────────────────────────────────────────────

function getStampsChangeMessage(
  action: WalletAction,
  remaining: number | undefined,
): string | undefined {
  if (!action) return undefined
  switch (action) {
    case 'add':
      if (remaining !== undefined && remaining <= 0)
        return 'Récompense débloquée ! 🎉 Montre ce pass au comptoir'
      return `%@ tampon(s) — encore ${remaining ?? '?'} avant ta récompense ! 🎯`
    case 'deduct':
      return 'Carte mise à jour — %@ tampon(s)'
    case 'reset':
      return 'Récompense échangée ! On repart pour un tour 🚀'
    case 'claim-reward':
      return 'Récompense échangée ! 🎉'
    default:
      return undefined
  }
}

function getPointsChangeMessage(action: WalletAction): string | undefined {
  if (!action) return undefined
  switch (action) {
    case 'add':
      return '+%@ point(s) crédités sur ta carte 🎯'
    case 'deduct':
      return '%@ point(s) débités'
    case 'claim-reward':
      return 'Récompense échangée ! 🎉'
    default:
      return undefined
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export interface GeneratePassOptions {
  action?: WalletAction
  remainingForReward?: number
}

/**
 * Generates a .pkpass buffer for the loyalty card identified by qrCodeId.
 * Returns null if the card or business is not found.
 *
 * Design 2026-05-13 v2 (matching app loyalty card + DS Izou #1E1E1E) :
 *   - backgroundColor : #1E1E1E (noir DS Izou)
 *   - logo.png        : wordmark IZOU blanc reduit (120x35 / 240x70 @2x)
 *   - headerFields    : "BONJOUR {NOM}" en haut a droite
 *   - strip.png       : COMPOSITE image commerce (top) + grille tampons (bottom)
 *                       genere dynamiquement via Sharp + SVG inline. Permet
 *                       d'afficher la grille de tampons visuellement, ce qui
 *                       n'est PAS possible nativement dans pkpass (qui ne
 *                       supporte que des fields texte).
 *   - secondaryFields : COMMERCE + RÉCOMPENSE
 *   - barcodes        : QR code en bas
 *
 * LIMITATIONS Apple Wallet (a divulguer au user) :
 *   - Pas de bande blanche distincte du fond noir (background unique)
 *   - Pas de grille de tampons "live" — uniquement composite figee dans strip
 *   - Logo taille bornee par Apple (~160x50 max @1x)
 */
export async function generatePkpass(
  qrCodeId: string,
  options?: GeneratePassOptions,
): Promise<Buffer | null> {
  const action = options?.action ?? null
  const remainingForReward = options?.remainingForReward
  const supabase = createServiceClient()

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('*, customers(*)')
    .eq('qr_code_id', qrCodeId)
    .single()

  if (!card) return null

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', card.business_id)
    .single()

  if (!business) return null

  const color = business.primary_color || '#1E1E1E'
  const [r, g, b] = hexToRgb(color)
  const isStamps = business.loyalty_type === 'stamps'
  const stampsRequired = business.stamps_required ?? 10
  const stampsCount = Math.min(card.current_stamps ?? 0, stampsRequired)
  const pointsBalance = card.current_points ?? 0
  const clientName: string = (card.customers?.first_name ?? 'Client').toUpperCase()

  // URL strip image source : merchant ou fallback Izou.
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '')
  const defaultCardImage = `${supabaseUrl}/storage/v1/object/public/public-assets/cards/loyalty-card-default.webp`
  const stripImageUrl: string = business.card_image_url || defaultCardImage

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: PASS_TYPE_ID,
    serialNumber: qrCodeId,
    teamIdentifier: TEAM_ID,
    organizationName: business.business_name,
    description: 'Carte de fidélité',
    backgroundColor: `rgb(${r},${g},${b})`,
    foregroundColor: 'rgb(255,255,255)',
    labelColor: 'rgb(180,180,180)',
    webServiceURL: `${BASE_URL}/api/wallet`,
    authenticationToken: generateAuthToken(qrCodeId),
    storeCard: isStamps
      ? {
          headerFields: [
            { key: 'greeting', label: 'BONJOUR', value: clientName },
          ],
          // primaryFields vide : la grille de tampons est rendue DANS le strip.
          // Le counter "X / Y" est dans secondaryFields (rendu en font native
          // Apple Wallet — evite le bug font corrompue qu'on aurait en SVG sur
          // le serverless).
          primaryFields: [],
          secondaryFields: [
            {
              key: 'stamps',
              label: 'TAMPONS',
              value: `${stampsCount} / ${stampsRequired}`,
              ...(getStampsChangeMessage(action, remainingForReward) && {
                changeMessage: getStampsChangeMessage(action, remainingForReward),
              }),
            },
            ...(business.stamps_reward
              ? [{ key: 'reward', label: 'RÉCOMPENSE', value: business.stamps_reward }]
              : []),
          ],
          auxiliaryFields: [
            { key: 'business', label: 'COMMERCE', value: business.business_name },
          ],
          backFields: [
            {
              key: 'info',
              label: 'Comment ça marche',
              value: `Présentez ce pass à chaque visite pour accumuler des tampons. Après ${stampsRequired} tampons : ${business.stamps_reward ?? 'récompense débloquée'}.`,
            },
          ],
        }
      : {
          headerFields: [
            { key: 'greeting', label: 'BONJOUR', value: clientName },
          ],
          primaryFields: [
            {
              key: 'points',
              label: 'POINTS',
              value: String(pointsBalance),
              ...(getPointsChangeMessage(action) && {
                changeMessage: getPointsChangeMessage(action),
              }),
            },
          ],
          secondaryFields: [
            { key: 'business', label: 'COMMERCE', value: business.business_name },
          ],
          backFields: [
            {
              key: 'info',
              label: 'Comment ça marche',
              value: 'Présentez ce pass à chaque visite pour accumuler des points de fidélité.',
            },
          ],
        },
    barcodes: [
      { message: qrCodeId, format: 'PKBarcodeFormatQR', messageEncoding: 'iso-8859-1' },
    ],
    barcode: { message: qrCodeId, format: 'PKBarcodeFormatQR', messageEncoding: 'iso-8859-1' },
  }

  // Note: changeMessage est deja injecte dans secondaryFields[stamps] (mode stamps)
  // ou primaryFields[points] (mode points) via le spread conditionnel ci-dessus.

  const passJsonBuf = Buffer.from(JSON.stringify(passJson))

  // Generation parallele des assets PNG.
  const [icon, icon2x, logo, logo2x, strip, strip2x] = await Promise.all([
    generateIconPng(29),
    generateIconPng(58),
    generateLogoPng(120, 35, business.logo_url),
    generateLogoPng(240, 70, business.logo_url),
    generateCompositeStrip(stripImageUrl, 375, 144, stampsRequired, stampsCount, isStamps),
    generateCompositeStrip(stripImageUrl, 750, 288, stampsRequired, stampsCount, isStamps),
  ])

  const sha1 = (buf: Buffer | string) => createHash('sha1').update(buf).digest('hex')
  const manifestEntries: Record<string, string> = {
    'pass.json': sha1(passJsonBuf),
    'icon.png': sha1(icon),
    'icon@2x.png': sha1(icon2x),
    'logo.png': sha1(logo),
    'logo@2x.png': sha1(logo2x),
  }
  if (strip && strip2x) {
    manifestEntries['strip.png'] = sha1(strip)
    manifestEntries['strip@2x.png'] = sha1(strip2x)
  }
  const manifest = JSON.stringify(manifestEntries)

  const keyB64 = process.env.APPLE_PASS_KEY_B64
  const certB64 = process.env.APPLE_PASS_CERT_B64
  const wwdrB64 = process.env.APPLE_WWDR_CERT_B64

  if (!keyB64 || !certB64 || !wwdrB64) {
    const missing = [
      !keyB64 && 'APPLE_PASS_KEY_B64',
      !certB64 && 'APPLE_PASS_CERT_B64',
      !wwdrB64 && 'APPLE_WWDR_CERT_B64',
    ].filter(Boolean).join(', ')
    console.error(`[wallet] missing Apple Wallet env vars: ${missing}. Pass cannot be signed.`)
    return null
  }

  const keyPem = Buffer.from(keyB64, 'base64').toString()
  const certPem = Buffer.from(certB64, 'base64').toString()
  const wwdrPem = Buffer.from(wwdrB64, 'base64').toString()

  let signature: Buffer
  try {
    signature = signManifest(keyPem, certPem, wwdrPem, manifest)
  } catch (err) {
    console.error('[wallet] signing failed (likely invalid/expired cert or key/cert mismatch):', err)
    return null
  }

  const zip = new JSZip()
  zip.file('pass.json', passJsonBuf)
  zip.file('manifest.json', manifest)
  zip.file('signature', signature)
  zip.file('icon.png', icon)
  zip.file('icon@2x.png', icon2x)
  zip.file('logo.png', logo)
  zip.file('logo@2x.png', logo2x)
  if (strip && strip2x) {
    zip.file('strip.png', strip)
    zip.file('strip@2x.png', strip2x)
  }

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}
