import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { joinUrl } from '@/lib/config'
import { buildShareCard } from '@/lib/share-card'
import { z } from 'zod'

/**
 * GET /api/share-card/[shortCode]
 *
 * Genere une image PNG "fiche partage" pour un commerce — destinee aux
 * stories Insta et partages sociaux. Retourne l'image directement (1080x1350,
 * cache 1h).
 *
 * Optionnel : ?ref=PRENOM-XXXX pour inclure le code parrainage dans l'URL
 * inscription encodee dans le QR.
 *
 * Note 2026-05-13 : NE PAS utiliser withErrorHandler ici — sinon une erreur
 * renvoie du JSON et le <img src=...> casse silencieusement. On gere les
 * erreurs explicitement avec un Content-Type approprie.
 */

// 64 char pour autoriser les UUID (36 chars) en plus des shortCodes courts.
const idSchema = z.string().regex(/^[A-Za-z0-9_-]{2,64}$/)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const SELECT_COLUMNS =
  'id, business_name, logo_url, banner_url, card_image_url, description, address, phone, website_url, short_code'

// Force le runtime nodejs (sharp + qrcode requierent les binaires natifs,
// pas dispo en runtime edge).
export const runtime = 'nodejs'

export async function GET(request: NextRequest, context: { params: Promise<{ shortCode: string }> }) {
  try {
    const { shortCode } = await context.params
    const parsed = idSchema.safeParse(shortCode)
    if (!parsed.success) {
      return NextResponse.json({ error: 'shortCode invalide' }, { status: 400 })
    }
    const id = parsed.data

    const refParam = request.nextUrl.searchParams.get('ref')
    const formatParam = request.nextUrl.searchParams.get('format') === 'story' ? 'story' : 'post'

    const supabase = createServiceClient()

    // Recherche : short_code d'abord (cas le plus frequent), id en fallback
    // uniquement si format UUID (sinon Postgres rejette eq('id', 'non-uuid')
    // ce qui cassait l'ancien .or() query — bug 2026-05-13).
    let { data: business } = await supabase
      .from('businesses')
      .select(SELECT_COLUMNS)
      .eq('short_code', id)
      .maybeSingle()

    if (!business && UUID_RE.test(id)) {
      const fallback = await supabase
        .from('businesses')
        .select(SELECT_COLUMNS)
        .eq('id', id)
        .maybeSingle()
      business = fallback.data
    }

    if (!business) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 })
    }

    const target = business.short_code || business.id
    const inscriptionUrl = joinUrl(target)

    const buf = await buildShareCard({
      businessName: business.business_name,
      description: business.description,
      logoUrl: business.logo_url,
      bannerUrl: business.banner_url || business.card_image_url,
      address: business.address,
      phone: business.phone,
      website: business.website_url,
      inscriptionUrl,
      referralCode: refParam || null,
      format: formatParam,
    })

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Content-Length': String(buf.length),
      },
    })
  } catch (e) {
    console.error('[share-card] generation failed:', e)
    return NextResponse.json(
      {
        error: 'share-card generation failed',
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    )
  }
}
