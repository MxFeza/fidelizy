import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cardWriteLimiter, getIP } from '@/lib/ratelimit'
import { addToCard, ServiceError } from '@/lib/services/loyalty.service'

export async function POST(request: NextRequest) {
  try {
    const { success } = await cardWriteLimiter.limit(getIP(request))
    if (!success) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessaie dans quelques secondes.' }, { status: 429 })
    }

    const { card_id, type, amount } = await request.json()

    if (!card_id || !type || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }
    if (type !== 'stamps' && type !== 'points') {
      return NextResponse.json({ error: 'Type invalide (stamps ou points)' }, { status: 400 })
    }
    if (!Number.isInteger(amount) || amount > 1000) {
      return NextResponse.json({ error: 'Montant invalide (entier entre 1 et 1000)' }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id, business_name, stamps_required, stamps_reward, loyalty_type, points_per_euro')
      .eq('id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 })
    }

    const result = await addToCard(supabase, {
      cardId: card_id,
      businessId: business.id,
      type,
      amount,
      businessName: business.business_name,
      stampsRequired: business.stamps_required,
      stampsReward: business.stamps_reward,
      pointsPerEuro: business.points_per_euro,
    })

    return NextResponse.json({ success: true, message: result.message, new_value: result.newValue })
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}
