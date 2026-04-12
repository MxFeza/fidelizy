import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { pushLimiter, getIP } from '@/lib/ratelimit'
import { sendPushToCard } from '@/lib/push/sendPush'
import { cardUrl } from '@/lib/config'
import { AppError, withErrorHandler } from '@/lib/errors'

export const POST = withErrorHandler(async (request) => {
  const { success } = await pushLimiter.limit(getIP(request))
  if (!success) throw AppError.rateLimit('Trop de requêtes.')

  const { cardId, subscription } = await request.json()
  if (!cardId || !subscription?.endpoint) throw AppError.validation('Paramètres manquants')

  const supabase = createServiceClient()

  const { data: card, error: cardError } = await supabase
    .from('loyalty_cards')
    .select('id, business_id, qr_code_id')
    .eq('id', cardId)
    .single()

  if (cardError || !card) throw AppError.notFound('Carte introuvable')

  const { count: existingCount } = await supabase
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('card_id', card.id)

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
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('card_id', card.id)
      .eq('subscription->>endpoint', subscription.endpoint)

    await supabase
      .from('push_subscriptions')
      .insert({
        card_id: card.id,
        business_id: card.business_id,
        subscription,
      })
      .throwOnError()
  }

  if (existingCount === 0) {
    const { data: biz } = await supabase
      .from('businesses')
      .select('business_name')
      .eq('id', card.business_id)
      .single()

    sendPushToCard(card.id, {
      title: 'Izou',
      body: `Bienvenue ! Votre carte de fidélité ${biz?.business_name || ''} est prête.`,
      url: cardUrl(card.qr_code_id),
    }).catch((err) => console.error('Welcome push error:', err))
  }

  return NextResponse.json({ ok: true })
})

export const DELETE = withErrorHandler(async (request) => {
  const { success } = await pushLimiter.limit(getIP(request))
  if (!success) throw AppError.rateLimit('Trop de requêtes.')

  const { cardId, endpoint } = await request.json()
  if (!cardId || !endpoint) throw AppError.validation('Paramètres manquants')

  const supabase = createServiceClient()

  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('card_id', cardId)
    .eq('subscription->>endpoint', endpoint)
    .throwOnError()

  return NextResponse.json({ ok: true })
})
