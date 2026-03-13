import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { missionCompleteLimiter, getIP } from '@/lib/ratelimit'
import { sendPushToCard } from '@/lib/push/sendPush'
import { notifyWalletDevices } from '@/lib/wallet/push'
import { setPendingWalletAction } from '@/lib/wallet/generatePass'
import { atomicIncrementPoints } from '@/lib/db/atomic'

export async function POST(request: NextRequest) {
  const { cardId, templateKey, proofUrl } = await request.json()

  if (!cardId || !templateKey) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  // Rate limit by cardId
  const { success } = await missionCompleteLimiter.limit(`card:${cardId}`)
  if (!success) {
    return NextResponse.json({ error: 'Trop de requêtes. Réessayez plus tard.' }, { status: 429 })
  }

  const supabase = createServiceClient()

  // Get card
  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id, business_id, current_points, birthday, qr_code_id, customers!inner(email)')
    .eq('id', cardId)
    .single()

  if (!card) {
    return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })
  }

  // Get mission
  const { data: mission } = await supabase
    .from('missions')
    .select('*')
    .eq('business_id', card.business_id)
    .eq('template_key', templateKey)
    .eq('is_active', true)
    .single()

  if (!mission) {
    return NextResponse.json({ error: 'Mission introuvable ou inactive' }, { status: 404 })
  }

  // Check not already completed (for one-time missions)
  if (templateKey !== 'monthly_visits') {
    const { data: existing } = await supabase
      .from('mission_completions')
      .select('id')
      .eq('card_id', cardId)
      .eq('mission_id', mission.id)
      .eq('status', 'completed')
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Mission déjà complétée' }, { status: 400 })
    }
  }

  switch (templateKey) {
    case 'google_review': {
      if (!proofUrl || typeof proofUrl !== 'string') {
        return NextResponse.json({ error: 'Lien Google requis' }, { status: 400 })
      }

      // Check no pending review already
      const { data: pendingExisting } = await supabase
        .from('mission_completions')
        .select('id')
        .eq('card_id', cardId)
        .eq('mission_id', mission.id)
        .eq('status', 'pending_review')
        .maybeSingle()

      if (pendingExisting) {
        return NextResponse.json({ error: 'Un avis est déjà en attente de validation' }, { status: 400 })
      }

      await supabase.from('mission_completions').insert({
        card_id: cardId,
        mission_id: mission.id,
        proof_url: proofUrl,
        status: 'pending_review',
        points_awarded: mission.reward_points,
      })

      return NextResponse.json({ status: 'pending_review', message: 'Avis soumis, en attente de validation' })
    }

    case 'complete_profile': {
      const customer = card.customers as unknown as { email: string | null }
      const hasEmail = !!customer?.email
      const hasBirthday = !!(card as unknown as { birthday: string | null }).birthday

      if (!hasEmail || !hasBirthday) {
        return NextResponse.json({
          error: 'Profil incomplet. Renseignez votre email et date d\'anniversaire.',
          missing: {
            email: !hasEmail,
            birthday: !hasBirthday,
          },
        }, { status: 400 })
      }

      // Credit points atomically
      const newPoints = await atomicIncrementPoints(supabase, cardId, mission.reward_points)

      await supabase.from('mission_completions').insert({
        card_id: cardId,
        mission_id: mission.id,
        status: 'completed',
        points_awarded: mission.reward_points,
      })

      await supabase.from('transactions').insert({
        loyalty_card_id: cardId,
        business_id: card.business_id,
        type: 'earn',
        stamps_added: null,
        points_added: mission.reward_points,
        description: `Mission : Profil complété (+${mission.reward_points} pts)`,
      })

      sendPushToCard(cardId, {
        title: 'Izou',
        body: `Mission accomplie ! +${mission.reward_points} points 🎯`,
      }).catch(() => {})

      // Update wallet
      setPendingWalletAction(card.qr_code_id, 'add')
      notifyWalletDevices(card.qr_code_id).catch(() => {})

      return NextResponse.json({ status: 'completed', points_awarded: mission.reward_points, new_points: newPoints })
    }

    case 'monthly_visits':
      return NextResponse.json({ error: 'Les visites mensuelles sont comptées automatiquement' }, { status: 400 })

    case 'referral':
      return NextResponse.json({ error: 'Le parrainage est géré à l\'inscription' }, { status: 400 })

    default:
      return NextResponse.json({ error: 'Template de mission inconnu' }, { status: 400 })
  }
}
