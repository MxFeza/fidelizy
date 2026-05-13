import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { joinUrl } from '@/lib/config'
import { buildShareCard } from '@/lib/share-card'
import { AppError, withErrorHandler } from '@/lib/errors'
import { z } from 'zod'

/**
 * GET /api/share-card/[shortCode]
 *
 * Genere une image PNG "fiche partage" pour un commerce — destinee aux
 * stories Insta et partages sociaux. Retourne l'image directement (1080x1350,
 * cache 1h).
 *
 * Optionnel : ?ref=PRENOM-XXXX pour inclure le code parrainage dans l'URL
 * inscription encodee dans le QR (utilise par le bouton "Partager" cote client).
 */

const shortCodeSchema = z.string().regex(/^[A-Za-z0-9_-]{2,32}$/)

export const GET = withErrorHandler(async (request: NextRequest, context?: unknown) => {
  const ctx = context as { params: Promise<{ shortCode: string }> } | undefined
  const params = ctx?.params ? await ctx.params : { shortCode: '' }
  const parsed = shortCodeSchema.safeParse(params.shortCode)
  if (!parsed.success) throw AppError.validation('shortCode invalide')

  const refParam = request.nextUrl.searchParams.get('ref')

  const supabase = createServiceClient()
  // Recherche par short_code ou id (defensive)
  const { data: business } = await supabase
    .from('businesses')
    .select(
      'id, business_name, logo_url, banner_url, card_image_url, description, address, phone, website_url, short_code',
    )
    .or(`short_code.eq.${parsed.data},id.eq.${parsed.data}`)
    .maybeSingle()

  if (!business) throw AppError.notFound('Commerce introuvable')

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
  })

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
})
