import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { sendPushToCard } from '@/lib/push/sendPush'
import { notifyWalletDevices } from '@/lib/wallet/push'
import { setPendingWalletAction } from '@/lib/wallet/generatePass'

interface RouteParams {
  params: Promise<{ cardId: string }>
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { cardId } = await params
  const supabase = createServiceClient()

  // Get card by qr_code_id
  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id, business_id, current_points, qr_code_id')
    .eq('qr_code_id', cardId)
    .single()

  if (!card) {
    return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })
  }

  const today = new Date().toISOString().split('T')[0]

  // Insert visit (ON CONFLICT DO NOTHING — 1 per day via PK)
  await supabase
    .from('pwa_visits')
    .upsert({ card_id: card.id, visit_date: today }, { onConflict: 'card_id,visit_date', ignoreDuplicates: true })

  // Check if monthly_visits mission is active
  const { data: mission } = await supabase
    .from('missions')
    .select('id, reward_points, config')
    .eq('business_id', card.business_id)
    .eq('template_key', 'monthly_visits')
    .eq('is_active', true)
    .maybeSingle()

  if (!mission) {
    return NextResponse.json({ ok: true })
  }

  const target = (mission.config as Record<string, unknown>)?.target as number ?? 5
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Count visits this month
  const { count } = await supabase
    .from('pwa_visits')
    .select('card_id', { count: 'exact', head: true })
    .eq('card_id', card.id)
    .gte('visit_date', monthStart)

  const visitCount = count ?? 0

  if (visitCount >= target) {
    // Check if already completed this month
    const { data: existing } = await supabase
      .from('mission_completions')
      .select('id')
      .eq('card_id', card.id)
      .eq('mission_id', mission.id)
      .eq('period', currentPeriod)
      .maybeSingle()

    if (!existing) {
      // Credit points
      const newPoints = card.current_points + mission.reward_points
      await supabase
        .from('loyalty_cards')
        .update({ current_points: newPoints })
        .eq('id', card.id)

      await supabase.from('mission_completions').insert({
        card_id: card.id,
        mission_id: mission.id,
        status: 'completed',
        period: currentPeriod,
        points_awarded: mission.reward_points,
      })

      await supabase.from('transactions').insert({
        loyalty_card_id: card.id,
        business_id: card.business_id,
        type: 'earn',
        stamps_added: null,
        points_added: mission.reward_points,
        description: `Mission : ${target} visites ce mois (+${mission.reward_points} pt${mission.reward_points > 1 ? 's' : ''})`,
      })

      sendPushToCard(card.id, {
        title: 'Objectif atteint !',
        body: `Objectif du mois atteint ! +${mission.reward_points} point${mission.reward_points > 1 ? 's' : ''} 🏆`,
      }).catch(() => {})

      // Update wallet
      setPendingWalletAction(card.qr_code_id, 'add')
      notifyWalletDevices(card.qr_code_id).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true })
}
