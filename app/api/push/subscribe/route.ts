import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { pushLimiter, getIP } from '@/lib/ratelimit'
import { sendPushToCard } from '@/lib/push/sendPush'

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

  // Verify card exists and get business_id + qr_code_id
  const { data: card, error: cardError } = await supabase
    .from('loyalty_cards')
    .select('id, business_id, qr_code_id')
    .eq('id', cardId)
    .single()

  if (cardError || !card) {
    return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })
  }

  // Check if this is the first subscription for this card (before upsert)
  const { count: existingCount } = await supabase
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('card_id', card.id)

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

  // Send welcome notification for first-time subscription (non-blocking)
  if (existingCount === 0) {
    const { data: biz } = await supabase
      .from('businesses')
      .select('business_name')
      .eq('id', card.business_id)
      .single()

    sendPushToCard(card.id, {
      title: 'Izou',
      body: `Bienvenue ! 🎉 Votre carte de fidélité ${biz?.business_name || ''} est prête.`,
      url: `https://fidelizy.vercel.app/card/${card.qr_code_id}`,
    }).catch((err) => console.error('Welcome push error:', err))
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
