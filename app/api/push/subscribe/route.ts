import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { pushLimiter, getIP } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  const { success } = await pushLimiter.limit(getIP(request))
  if (!success) {
    return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })
  }

  const { cardId, subscription } = await request.json()

  if (!cardId || !subscription?.endpoint) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Verify card exists and get business_id
  const { data: card, error: cardError } = await supabase
    .from('cards')
    .select('id, business_id')
    .eq('id', cardId)
    .single()

  if (cardError || !card) {
    return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })
  }

  // Upsert subscription (avoid duplicates on endpoint)
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        card_id: card.id,
        business_id: card.business_id,
        subscription,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'card_id,subscription->>endpoint' }
    )

  if (error) {
    // Fallback: try delete + insert if upsert on jsonb expression fails
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('card_id', card.id)
      .eq('subscription->>endpoint', subscription.endpoint)

    const { error: insertError } = await supabase
      .from('push_subscriptions')
      .insert({
        card_id: card.id,
        business_id: card.business_id,
        subscription,
      })

    if (insertError) {
      console.error('Push subscribe error:', insertError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const { success } = await pushLimiter.limit(getIP(request))
  if (!success) {
    return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })
  }

  const { cardId, endpoint } = await request.json()

  if (!cardId || !endpoint) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('card_id', cardId)
    .eq('subscription->>endpoint', endpoint)

  if (error) {
    console.error('Push unsubscribe error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
