import { createServiceClient } from '@/lib/supabase/service'
import { createHmac, createHash, timingSafeEqual } from 'node:crypto'
import { deflateSync } from 'node:zlib'
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

// ── PNG helpers ───────────────────────────────────────────────────────────────

function crc32(data: Buffer): number {
  let crc = 0xffffffff
  for (const byte of data) {
    let c = (crc ^ byte) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Buffer): Buffer {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcBuf])
}

function solidPng(size: number, r: number, g: number, b: number): Buffer {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: RGB
  const row = Buffer.alloc(1 + size * 3)
  for (let x = 0; x < size; x++) {
    row[1 + x * 3] = r
    row[2 + x * 3] = g
    row[3 + x * 3] = b
  }
  const raw = Buffer.concat(Array.from({ length: size }, () => row))
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.startsWith('#') ? hex.slice(1) : hex
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
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
// Stores the last action per qrCodeId so the wallet download endpoint can
// include the right changeMessage. Entries expire after 30 seconds.

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
        return 'R\u00e9compense d\u00e9bloqu\u00e9e ! \ud83c\udf89 Montre ce pass au comptoir'
      return `%@ tampon(s) \u2014 encore ${remaining ?? '?'} avant ta r\u00e9compense ! \ud83c\udfaf`
    case 'deduct':
      return 'Carte mise \u00e0 jour \u2014 %@ tampon(s)'
    case 'reset':
      return 'R\u00e9compense \u00e9chang\u00e9e ! On repart pour un tour \ud83d\ude80'
    case 'claim-reward':
      return 'R\u00e9compense \u00e9chang\u00e9e ! \ud83c\udf89'
    default:
      return undefined
  }
}

function getPointsChangeMessage(action: WalletAction): string | undefined {
  if (!action) return undefined
  switch (action) {
    case 'add':
      return '+%@ point(s) cr\u00e9dit\u00e9s sur ta carte \ud83c\udfaf'
    case 'deduct':
      return '%@ point(s) d\u00e9bit\u00e9s'
    case 'claim-reward':
      return 'R\u00e9compense \u00e9chang\u00e9e ! \ud83c\udf89'
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
 * When action is provided, adds changeMessage to fields for lock screen notifications.
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

  const color = business.primary_color || '#4f46e5'
  const [r, g, b] = hexToRgb(color)
  const isStamps = business.loyalty_type === 'stamps'
  const stampsRequired = business.stamps_required ?? 10
  const stampsCount = Math.min(card.current_stamps ?? 0, stampsRequired)
  const pointsBalance = card.current_points ?? 0
  const clientName: string = card.customers?.first_name ?? 'Client'

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: PASS_TYPE_ID,
    serialNumber: qrCodeId,
    teamIdentifier: TEAM_ID,
    organizationName: business.business_name,
    description: 'Carte de fidélité',
    backgroundColor: `rgb(${r},${g},${b})`,
    foregroundColor: 'rgb(255,255,255)',
    labelColor: 'rgb(220,220,255)',
    webServiceURL: `${BASE_URL}/api/wallet`,
    authenticationToken: generateAuthToken(qrCodeId),
    storeCard: isStamps
      ? {
          primaryFields: [
            {
              key: 'stamps',
              label: 'TAMPONS',
              value: `${stampsCount} / ${stampsRequired}`,
              ...(getStampsChangeMessage(action, remainingForReward) && {
                changeMessage: getStampsChangeMessage(action, remainingForReward),
              }),
            },
          ],
          secondaryFields: business.stamps_reward
            ? [{ key: 'reward', label: 'RÉCOMPENSE', value: business.stamps_reward }]
            : [],
          auxiliaryFields: [{ key: 'client', label: 'CLIENT', value: clientName }],
          backFields: [
            {
              key: 'info',
              label: 'Comment ça marche',
              value: `Présentez ce pass à chaque visite pour accumuler des tampons. Après ${stampsRequired} tampons : ${business.stamps_reward ?? 'récompense débloquée'}.`,
            },
          ],
        }
      : {
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
          auxiliaryFields: [{ key: 'client', label: 'CLIENT', value: clientName }],
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

  const passJsonBuf = Buffer.from(JSON.stringify(passJson))
  const icon = solidPng(58, r, g, b)
  const icon2x = solidPng(87, r, g, b)

  const sha1 = (buf: Buffer | string) => createHash('sha1').update(buf).digest('hex')
  const manifest = JSON.stringify({
    'pass.json': sha1(passJsonBuf),
    'icon.png': sha1(icon),
    'icon@2x.png': sha1(icon2x),
  })

  const keyPem = Buffer.from(process.env.APPLE_PASS_KEY_B64!, 'base64').toString()
  const certPem = Buffer.from(process.env.APPLE_PASS_CERT_B64!, 'base64').toString()
  const wwdrPem = Buffer.from(process.env.APPLE_WWDR_CERT_B64!, 'base64').toString()

  let signature: Buffer
  try {
    signature = signManifest(keyPem, certPem, wwdrPem, manifest)
  } catch (err) {
    console.error('Wallet signing error:', err)
    return null
  }

  const zip = new JSZip()
  zip.file('pass.json', passJsonBuf)
  zip.file('manifest.json', manifest)
  zip.file('signature', signature)
  zip.file('icon.png', icon)
  zip.file('icon@2x.png', icon2x)

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}
