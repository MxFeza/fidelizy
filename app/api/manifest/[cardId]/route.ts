import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params
  const supabase = await createClient()

  let businessName = 'Fidelizy'
  let themeColor = '#4f46e5'

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('business_id')
    .eq('qr_code_id', cardId)
    .single()

  if (card) {
    const { data: business } = await supabase
      .from('businesses')
      .select('business_name, primary_color')
      .eq('id', card.business_id)
      .single()

    if (business) {
      businessName = business.business_name
      themeColor = business.primary_color || '#4f46e5'
    }
  }

  const manifest = {
    name: businessName,
    short_name: businessName.length > 12 ? businessName.slice(0, 12) : businessName,
    description: `Carte de fidélité ${businessName}`,
    start_url: `/card/${cardId}`,
    scope: `/card/${cardId}`,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: themeColor,
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
