import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { profileUpdateLimiter, getIP } from '@/lib/ratelimit'
import { sendPushToCard } from '@/lib/push/sendPush'

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

  // Get card + customer
  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id, business_id, current_points, birthday, customer_id, customers!inner(email)')
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

  // Re-check if profile is now complete
  const { data: updatedCard } = await supabase
    .from('loyalty_cards')
    .select('id, birthday, current_points, customers!inner(email)')
    .eq('id', cardId)
    .single()

  if (!updatedCard) {
    return NextResponse.json({ ok: true })
  }

  const updatedCustomer = updatedCard.customers as unknown as { email: string | null }
  const hasEmail = !!updatedCustomer?.email
  const hasBirthday = !!updatedCard.birthday

  if (hasEmail && hasBirthday) {
    // Check if complete_profile mission is active and not yet completed
    const { data: mission } = await supabase
      .from('missions')
      .select('id, reward_points')
      .eq('business_id', card.business_id)
      .eq('template_key', 'complete_profile')
      .eq('is_active', true)
      .maybeSingle()

    if (mission) {
      const { data: existing } = await supabase
        .from('mission_completions')
        .select('id')
        .eq('card_id', cardId)
        .eq('mission_id', mission.id)
        .eq('status', 'completed')
        .maybeSingle()

      if (!existing) {
        const newPoints = updatedCard.current_points + mission.reward_points

        await supabase
          .from('loyalty_cards')
          .update({ current_points: newPoints })
          .eq('id', cardId)

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
          body: `Profil complété : +${mission.reward_points} points !`,
        }).catch(() => {})

        return NextResponse.json({ ok: true, mission_completed: true, points_awarded: mission.reward_points })
      }
    }
  }

  return NextResponse.json({ ok: true })
}
