import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { wheelLimiter, getIP } from '@/lib/ratelimit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { success } = await wheelLimiter.limit(getIP(request))
    if (!success) {
      return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })
    }

    const { cardId } = await params
    const supabase = createServiceClient()

    const { data: card } = await supabase
      .from('loyalty_cards')
      .select('id, current_points, business_id')
      .eq('qr_code_id', cardId)
      .single()

    if (!card) {
      return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id, gamification, loyalty_type')
      .eq('id', card.business_id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 })
    }

    const gamification = business.gamification ?? {}

    if (!gamification.wheel_enabled) {
      return NextResponse.json({ error: 'Roue désactivée' }, { status: 404 })
    }

    if (business.loyalty_type !== 'points') {
      return NextResponse.json({ error: 'La roue est disponible uniquement en mode points' }, { status: 400 })
    }

    const cost = gamification.wheel_cost_points ?? 10

    const { data: prizes } = await supabase
      .from('wheel_prizes')
      .select('id, label, emoji, probability, reward_type, reward_value, reward_description, sort_order')
      .eq('business_id', business.id)
      .order('sort_order', { ascending: true })

    if (!prizes || prizes.length < 2) {
      return NextResponse.json({ error: 'Roue non configurée' }, { status: 404 })
    }

    const segments = prizes.map(p => ({
      id: p.id,
      label: p.label,
      emoji: p.emoji,
      probability: p.probability,
    }))

    return NextResponse.json({
      segments,
      eligible: (card.current_points ?? 0) >= cost,
      cost,
      current_points: card.current_points ?? 0,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}
