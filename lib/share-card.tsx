/**
 * Generation d'une image "fiche partage" pour les commerces via Satori
 * (JSX → SVG avec text en glyphes paths) + Resvg-js (SVG → PNG).
 *
 * Pourquoi Satori : Sharp+libvips+Pango sur Vercel serverless n'arrivait
 * pas a rendre les <text> SVG avec fonts custom (Fontconfig errors, fallback
 * sur glyphes vides = boxes). Satori prend la font en Buffer direct et
 * embeds chaque glyph comme un path SVG → bypass total Pango/Fontconfig.
 *
 * Formats :
 *   - 'post'  (default) : 1080x1350 Instagram portrait 4:5
 *   - 'story'           : 1080x1920 Instagram story 9:16
 */

import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import QRCode from 'qrcode'
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getPublicAsset } from '@/lib/assets'
import type { ReactNode } from 'react'

// ── Font loading (module-level — cache au cold start) ─────────────────────────

function tryReadFont(filename: string): Buffer | null {
  const candidates = [
    join(process.cwd(), 'lib', 'fonts', filename),
    join(process.cwd(), '.next', 'server', 'lib', 'fonts', filename),
    join('/var/task', 'lib', 'fonts', filename),
  ]
  for (const p of candidates) {
    try {
      const buf = readFileSync(p)
      if (buf.length > 1000) {
        console.log(`[share-card] font loaded from ${p} (${buf.length} bytes)`)
        return buf
      }
    } catch {
      /* try next */
    }
  }
  console.error(`[share-card] FONT NOT FOUND: ${filename}. Tried: ${candidates.join(', ')}`)
  return null
}

const FONT_INTER_REGULAR = tryReadFont('Inter-Regular.ttf')
const FONT_INTER_BOLD = tryReadFont('Inter-Bold.ttf')

// ── Types ─────────────────────────────────────────────────────────────────────

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
  /** Format de sortie. Default : 'post' (1080x1350). */
  format?: ShareCardFormat
}

const FALLBACK_BANNER_URL = getPublicAsset('cards/loyalty-card-default.webp')

// ── Asset fetch + base64 ──────────────────────────────────────────────────────

async function fetchAsDataUrl(url: string, mimeOverride?: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const mime = mimeOverride || res.headers.get('content-type') || 'image/png'
    return `data:${mime};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

/** Logo merchant : fetch + convertit en PNG dans un cadre blanc arrondi via
 *  Sharp (Satori ne supporte pas SVG comme <img>, on PNG-ifie). */
async function buildLogoFramedDataUrl(logoUrl: string | null): Promise<string | null> {
  if (!logoUrl) return null
  try {
    const res = await fetch(logoUrl, { cache: 'no-store' })
    if (!res.ok) return null
    const logoBuf = Buffer.from(await res.arrayBuffer())
    const frameSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" rx="28" fill="white"/></svg>`
    const frameBuf = await sharp(Buffer.from(frameSvg)).png().toBuffer()
    const logoFitted = await sharp(logoBuf)
      .resize({ width: 150, height: 150, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer()
    const framed = await sharp(frameBuf)
      .composite([{ input: logoFitted, gravity: 'center' }])
      .png()
      .toBuffer()
    return `data:image/png;base64,${framed.toString('base64')}`
  } catch (e) {
    console.warn('[share-card] logo build failed', e)
    return null
  }
}

// ── Icons SVG (used in JSX directly) ──────────────────────────────────────────

function IconPin(): ReactNode {
  return {
    type: 'svg',
    props: {
      width: 22,
      height: 28,
      viewBox: '0 0 16 22',
      children: [
        {
          type: 'path',
          props: {
            d: 'M 0 8 C 0 3.6 3.6 0 8 0 C 12.4 0 16 3.6 16 8 C 16 14 8 22 8 22 C 8 22 0 14 0 8 Z M 8 11 C 9.7 11 11 9.7 11 8 C 11 6.3 9.7 5 8 5 C 6.3 5 5 6.3 5 8 C 5 9.7 6.3 11 8 11 Z',
            fill: '#666',
          },
        },
      ],
    },
  } as unknown as ReactNode
}

function IconPhone(): ReactNode {
  return {
    type: 'svg',
    props: {
      width: 22,
      height: 22,
      viewBox: '0 0 22 22',
      children: [
        {
          type: 'path',
          props: {
            d: 'M 5 0 L 7 0 L 9 6 L 7 7 C 8 9 11 12 13 13 L 14 11 L 20 13 L 20 16 C 20 19 18 21 15 21 C 7 21 0 14 0 5 C 0 2 2 0 5 0 Z',
            fill: '#666',
          },
        },
      ],
    },
  } as unknown as ReactNode
}

function IconGlobe(): ReactNode {
  return {
    type: 'svg',
    props: {
      width: 22,
      height: 22,
      viewBox: '0 0 22 22',
      children: [
        { type: 'circle', props: { cx: 11, cy: 11, r: 10, fill: 'none', stroke: '#666', strokeWidth: 1.6 } },
        { type: 'line', props: { x1: 1, y1: 11, x2: 21, y2: 11, stroke: '#666', strokeWidth: 1.6 } },
        { type: 'path', props: { d: 'M 11 1 C 6 5 6 17 11 21 M 11 1 C 16 5 16 17 11 21', fill: 'none', stroke: '#666', strokeWidth: 1.6 } },
      ],
    },
  } as unknown as ReactNode
}

// ── Wordmark Izou inline SVG (en noir #1E1E1E) ────────────────────────────────

function IzouWordmarkBlack(width: number, height: number): ReactNode {
  // Satori <svg> children, ratio 56.6 x 16.6
  return {
    type: 'svg',
    props: {
      width,
      height,
      viewBox: '0 0 56.6215 16.6021',
      children: [
        { type: 'path', props: { d: 'M47.409 16.6021C46.1894 16.6021 45.1088 16.3378 44.1673 15.8091C43.2473 15.2592 42.5198 14.4873 41.9848 13.4934C41.4713 12.4994 41.2145 11.3469 41.2145 10.0357V0.646059H44.9697V9.75022C44.9697 10.9979 45.28 11.9285 45.9005 12.5417C46.521 13.155 47.409 13.4617 48.5645 13.4617C49.8483 13.4617 50.8539 13.0387 51.5815 12.1928C52.3304 11.3469 52.7048 10.152 52.7048 8.60824V0.646059H56.46L56.6215 16.5698H52.9305L52.769 14.1913H52.2234C51.9452 14.7411 51.4424 15.2804 50.7149 15.8091C49.9874 16.3378 48.8854 16.6021 47.409 16.6021Z', fill: '#1E1E1E' } },
        { type: 'path', props: { d: 'M30.5074 16.6021C28.8923 16.6021 27.441 16.2846 26.1533 15.6498C24.8875 15.0149 23.8836 14.0943 23.1415 12.888C22.3995 11.6818 22.0285 10.2321 22.0285 8.53913V8.06297C22.0285 6.39112 22.3995 4.95207 23.1415 3.7458C23.8836 2.53953 24.8875 1.61896 26.1533 0.984078C27.441 0.328038 28.8923 1.7643e-05 30.5074 1.7643e-05C32.1224 1.7643e-05 33.5628 0.328038 34.8287 0.984078C36.1163 1.61896 37.1203 2.53953 37.8405 3.7458C38.5825 4.95207 38.9535 6.39112 38.9535 8.06297V8.53913C38.9535 10.2321 38.5825 11.6818 37.8405 12.888C37.1203 14.0943 36.1163 15.0149 34.8287 15.6498C33.5628 16.2846 32.1224 16.6021 30.5074 16.6021ZM30.5074 13.3007C31.8387 13.3007 32.9408 12.8775 33.8138 12.031C34.6868 11.1845 35.1233 9.99935 35.1233 8.47564V8.1582C35.1233 6.61333 34.6868 5.41764 33.8138 4.57114C32.9627 3.72464 31.8605 3.30138 30.5074 3.30138C29.1542 3.30138 28.0412 3.72464 27.1682 4.57114C26.2952 5.41764 25.8587 6.61333 25.8587 8.1582V8.47564C25.8587 9.99935 26.2952 11.1845 27.1682 12.031C28.0412 12.8775 29.1542 13.3007 30.5074 13.3007Z', fill: '#1E1E1E' } },
        { type: 'path', props: { d: 'M6.78301 16.6021V12.0571L15.5123 4.28856V3.80504H7.09589V0.646059H19.5172V5.19112L10.7566 12.9919V13.4754H19.7675V16.6021H6.78301Z', fill: '#1E1E1E' } },
        { type: 'path', props: { d: 'M0 16.6021V0.646059H3.94057V16.6021H0Z', fill: '#1E1E1E' } },
      ],
    },
  } as unknown as ReactNode
}

// ── Main builder ──────────────────────────────────────────────────────────────

export async function buildShareCard(opts: ShareCardOptions): Promise<Buffer> {
  if (!FONT_INTER_REGULAR || !FONT_INTER_BOLD) {
    throw new Error('Inter fonts not loaded — cannot generate share card')
  }

  const format: ShareCardFormat = opts.format === 'story' ? 'story' : 'post'
  const WIDTH = 1080
  const HEIGHT = format === 'story' ? 1920 : 1350
  const BANNER_HEIGHT = format === 'story' ? 700 : 540

  // QR url + content
  const qrUrl = opts.referralCode
    ? `${opts.inscriptionUrl}?ref=${encodeURIComponent(opts.referralCode)}`
    : opts.inscriptionUrl
  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    width: 320,
    margin: 0,
    color: { dark: '#1E1E1E', light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  })

  // Banner et logo en parallel
  const [bannerDataUrl, logoDataUrl] = await Promise.all([
    fetchAsDataUrl(opts.bannerUrl || FALLBACK_BANNER_URL),
    buildLogoFramedDataUrl(opts.logoUrl),
  ])

  const hasLogo = !!logoDataUrl
  const bannerSrc = bannerDataUrl || ''

  // Layout flex column propre : banner → content (flex 1) → footer QR
  // (sans absolute positioning qui causait l'overlap content/QR).
  const coordsItems: Array<unknown> = []
  if (opts.address) {
    coordsItems.push({
      type: 'div',
      props: {
        style: { display: 'flex', alignItems: 'center', gap: 16, fontSize: 26, color: '#333' },
        children: [IconPin(), opts.address],
      },
    })
  }
  if (opts.phone) {
    coordsItems.push({
      type: 'div',
      props: {
        style: { display: 'flex', alignItems: 'center', gap: 16, fontSize: 26, color: '#333' },
        children: [IconPhone(), opts.phone],
      },
    })
  }
  if (opts.website) {
    coordsItems.push({
      type: 'div',
      props: {
        style: { display: 'flex', alignItems: 'center', gap: 16, fontSize: 26, color: '#333' },
        children: [IconGlobe(), opts.website.replace(/^https?:\/\//, '').replace(/\/$/, '')],
      },
    })
  }

  const card = {
    type: 'div',
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter',
        backgroundColor: 'white',
      },
      children: [
        // === BANNER SECTION (relative wrapper for logo overlay) ===
        {
          type: 'div',
          props: {
            style: { width: WIDTH, height: BANNER_HEIGHT, position: 'relative', display: 'flex' },
            children: [
              bannerSrc
                ? {
                    type: 'img',
                    props: {
                      src: bannerSrc,
                      width: WIDTH,
                      height: BANNER_HEIGHT,
                      style: { width: WIDTH, height: BANNER_HEIGHT, objectFit: 'cover' },
                    },
                  }
                : {
                    type: 'div',
                    props: { style: { width: WIDTH, height: BANNER_HEIGHT, backgroundColor: '#1E1E1E' } },
                  },
              hasLogo
                ? {
                    type: 'img',
                    props: {
                      src: logoDataUrl,
                      width: 200,
                      height: 200,
                      style: {
                        position: 'absolute',
                        top: BANNER_HEIGHT - 80,
                        left: 60,
                        width: 200,
                        height: 200,
                      },
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },

        // === CONTENT SECTION (flex 1 — prend l'espace restant entre banner et footer)
        // NOTE Satori : tous les <div> qui contiennent du texte multiline DOIVENT
        // avoir `display: flex` explicite, sinon le wrap est ignore et les
        // enfants se chevauchent. On utilise `gap` au lieu de marginBottom
        // pour un spacing reliable.
        {
          type: 'div',
          props: {
            style: {
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: hasLogo ? '140px 60px 30px 60px' : '70px 60px 30px 60px',
              gap: 22,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: 60,
                    fontWeight: 700,
                    color: '#1E1E1E',
                    lineHeight: 1.1,
                    width: WIDTH - 120, // explicite pour forcer le wrap calculation
                    flexShrink: 0,
                  },
                  children: opts.businessName,
                },
              },
              opts.description
                ? {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        fontSize: 28,
                        color: '#666',
                        lineHeight: 1.4,
                        width: WIDTH - 120,
                        flexShrink: 0,
                      },
                      children: opts.description,
                    },
                  }
                : null,
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column', gap: 14, marginTop: 6, flexShrink: 0 },
                  children: coordsItems,
                },
              },
            ].filter(Boolean),
          },
        },

        // === FOOTER : QR + scan CTA + IZOU branding ===
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0 60px 36px 60px',
              gap: 14,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { fontSize: 24, fontWeight: 600, color: '#1E1E1E' },
                  children: 'Scannez pour rejoindre le programme',
                },
              },
              {
                type: 'img',
                props: { src: qrDataUrl, width: 280, height: 280, style: { width: 280, height: 280 } },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', marginTop: 6 },
                  children: [IzouWordmarkBlack(96, 28)],
                },
              },
            ],
          },
        },
      ],
    },
  }

  // Satori : rend en SVG (avec text en glyph paths, pas de dep font runtime)
  const svg = await satori(card as unknown as ReactNode, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: 'Inter', data: FONT_INTER_REGULAR, weight: 400, style: 'normal' },
      { name: 'Inter', data: FONT_INTER_BOLD, weight: 700, style: 'normal' },
    ],
  })

  // Resvg : convertit SVG en PNG (pas de dep font, tout est en paths)
  const resvg = new Resvg(svg, {
    background: 'white',
    fitTo: { mode: 'width', value: WIDTH },
  })
  return Buffer.from(resvg.render().asPng())
}
