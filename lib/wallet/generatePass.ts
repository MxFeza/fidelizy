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

/** Logo wordmark Izou blanc en PNG. Reduit (120x35 / 240x70 @2x) — retour user
 *  2026-05-13 : le logo precedent (150x44) etait trop gros visuellement. */
async function generateLogoPng(width: number, height: number): Promise<Buffer> {
  return sharp(Buffer.from(IZOU_WORDMARK_SVG_WHITE))
    .resize({ width, height, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
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
 * Genere le SVG de la grille de tampons pour la partie BAS du strip composite.
 * Dimensions : largeur x hauteur (750x144 @2x).
 *
 * Layout :
 *   - fond #1E1E1E
 *   - grille N tampons (2 rangees max), cercles blancs avec checkmark si filled
 *   - texte "X / Y tampons" en bas
 */
function buildStampsGridSvg(
  width: number,
  height: number,
  stampsRequired: number,
  stampsCount: number,
): string {
  const cols = stampsRequired <= 5 ? stampsRequired : Math.ceil(stampsRequired / 2)
  const rows = Math.ceil(stampsRequired / cols)
  const padX = 40
  const padTop = 18
  const padBottom = 32 // espace pour le texte en bas
  const gridW = width - padX * 2
  const gridH = height - padTop - padBottom
  const cellW = gridW / cols
  const cellH = gridH / rows
  const radius = Math.min(cellW, cellH) * 0.36

  let cells = ''
  for (let i = 0; i < stampsRequired; i++) {
    const r = Math.floor(i / cols)
    const c = i % cols
    const cx = padX + cellW * c + cellW / 2
    const cy = padTop + cellH * r + cellH / 2
    const filled = i < stampsCount
    if (filled) {
      const checkR = radius * 0.5
      cells += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#ffffff"/>`
      cells += `<path d="M ${cx - checkR} ${cy} l ${checkR * 0.7} ${checkR * 0.7} l ${checkR * 1.3} -${checkR * 1.3}" stroke="#1E1E1E" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
    } else {
      cells += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="2"/>`
    }
  }

  const counterY = height - 10
  const counterText = `${stampsCount}/${stampsRequired} tampons`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#1E1E1E"/>${cells}<text x="${padX}" y="${counterY}" fill="#ffffff" font-family="-apple-system,system-ui,sans-serif" font-size="22" font-weight="600">${counterText}</text></svg>`
}

/**
 * Composite strip image (Apple Wallet storeCard QR : 375x144 @1x, 750x288 @2x) :
 *   - moitie haute = image bandeau commerce (cover)
 *   - moitie basse = grille de tampons dynamique + compteur sur #1E1E1E
 *
 * NOTE limitations Apple Wallet : pkpass NE PERMET PAS d'avoir une vraie grille
 * de tampons custom dans le chrome — c'est uniquement du texte dans les fields.
 * On contourne en COMPOSITANT la grille DANS le strip image (qui est une simple
 * PNG). Du coup la grille n'est pas "interactive" mais elle est visible.
 *
 * Si le fetch de l'image commerce echoue : on retourne juste la moitie basse
 * (grille seule) pour avoir au moins quelque chose de visuel.
 */
async function generateCompositeStrip(
  imageUrl: string,
  width: number,
  height: number,
  stampsRequired: number,
  stampsCount: number,
  showStampsGrid: boolean,
): Promise<Buffer | null> {
  try {
    const halfHeight = Math.floor(height / 2)

    let imageBuf: Buffer | null = null
    try {
      const res = await fetch(imageUrl, { cache: 'no-store' })
      if (res.ok) {
        const inputBuf = Buffer.from(await res.arrayBuffer())
        imageBuf = await sharp(inputBuf)
          .resize({ width, height: halfHeight, fit: 'cover', position: 'center' })
          .png()
          .toBuffer()
      }
    } catch (e) {
      console.warn('[wallet] strip image fetch failed', e)
    }

    if (showStampsGrid) {
      const gridSvg = buildStampsGridSvg(width, height - halfHeight, stampsRequired, stampsCount)
      const gridBuf = await sharp(Buffer.from(gridSvg)).png().toBuffer()

      const composites: { input: Buffer; top: number; left: number }[] = [
        { input: gridBuf, top: halfHeight, left: 0 },
      ]
      if (imageBuf) composites.unshift({ input: imageBuf, top: 0, left: 0 })

      return await sharp({
        create: { width, height, channels: 4, background: { r: 30, g: 30, b: 30, alpha: 1 } },
      })
        .composite(composites)
        .png()
        .toBuffer()
    }

    // Mode points : juste l'image commerce a toute la hauteur (pas de grille).
    if (imageBuf) {
      const res = await fetch(imageUrl, { cache: 'no-store' })
      if (!res.ok) return null
      const inputBuf: Buffer = Buffer.from(await res.arrayBuffer())
      return await sharp(inputBuf)
        .resize({ width, height, fit: 'cover', position: 'center' })
        .png()
        .toBuffer()
    }
    return null
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
          // Ajouter un primary ici afficherait du texte par-dessus le strip
          // (illisible). Le "12/12 tampons" est dans le strip image directement.
          primaryFields: [],
          secondaryFields: [
            { key: 'business', label: 'COMMERCE', value: business.business_name },
            ...(business.stamps_reward
              ? [{ key: 'reward', label: 'RÉCOMPENSE', value: business.stamps_reward }]
              : []),
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

  // Generate stamps changeMessage si applicable (lock-screen notif).
  if (isStamps && action) {
    const msg = getStampsChangeMessage(action, remainingForReward)
    if (msg) {
      // On colle le changeMessage sur le headerField vu qu'il n'y a plus de primaryField stamps.
      passJson.storeCard.headerFields[0] = {
        ...passJson.storeCard.headerFields[0],
        ...{ changeMessage: msg },
      } as { key: string; label: string; value: string; changeMessage?: string }
    }
  }

  const passJsonBuf = Buffer.from(JSON.stringify(passJson))

  // Generation parallele des assets PNG.
  const [icon, icon2x, logo, logo2x, strip, strip2x] = await Promise.all([
    generateIconPng(29),
    generateIconPng(58),
    generateLogoPng(120, 35),
    generateLogoPng(240, 70),
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
