import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { profileUpdateLimiter, getIP } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  const { success } = await profileUpdateLimiter.limit(getIP(request))
  if (!success) {
    return NextResponse.json({ error: 'Trop de requêtes. Réessayez plus tard.' }, { status: 429 })
  }

  const { cardId, email, birthday } = await request.json()

  if (!cardId) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id, business_id, customer_id')
    .eq('id', cardId)
    .single()

  if (!card) {
    return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })
  }

  // Update email on customer if provided
  if (email && typeof email === 'string') {
    const trimmedEmail = email.trim().toLowerCase()
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      await supabase
        .from('customers')
        .update({ email: trimmedEmail })
        .eq('id', card.customer_id)
    }
  }

  // Update birthday on card if provided
  if (birthday && typeof birthday === 'string') {
    await supabase
      .from('loyalty_cards')
      .update({ birthday })
      .eq('id', cardId)
  }

  return NextResponse.json({ ok: true })
}
