import { createServiceClient } from '@/lib/supabase/service'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { missionValidateLimiter, getIP } from '@/lib/ratelimit'
import { sendPushToCard } from '@/lib/push/sendPush'
import { notifyWalletDevices } from '@/lib/wallet/push'
import { setPendingWalletAction } from '@/lib/wallet/generatePass'

export async function POST(request: NextRequest) {
  const { success } = await missionValidateLimiter.limit(getIP(request))
  if (!success) {
    return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })
  }

  // Auth check — merchant only
  const supabaseAuth = await createServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { completionId, approved } = await request.json()

  if (!completionId || typeof approved !== 'boolean') {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Get completion with mission info
  const { data: completion } = await supabase
    .from('mission_completions')
    .select('*, missions!inner(business_id, reward_points)')
    .eq('id', completionId)
    .eq('status', 'pending_review')
    .single()

  if (!completion) {
    return NextResponse.json({ error: 'Validation introuvable ou déjà traitée' }, { status: 404 })
  }

  const mission = completion.missions as unknown as { business_id: string; reward_points: number }

  // Verify merchant owns this business
  if (mission.business_id !== user.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  if (!approved) {
    // Delete the completion
    await supabase.from('mission_completions').delete().eq('id', completionId)
    return NextResponse.json({ status: 'rejected' })
  }

  // Approve: update status, credit points
  await supabase
    .from('mission_completions')
    .update({ status: 'completed' })
    .eq('id', completionId)

  // Get card to credit
  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id, current_points, qr_code_id')
    .eq('id', completion.card_id)
    .single()

  if (card) {
    const newPoints = card.current_points + completion.points_awarded
    await supabase
      .from('loyalty_cards')
      .update({ current_points: newPoints })
      .eq('id', card.id)

    await supabase.from('transactions').insert({
      loyalty_card_id: card.id,
      business_id: mission.business_id,
      type: 'earn',
      stamps_added: null,
      points_added: completion.points_awarded,
      description: `Mission : Avis Google validé (+${completion.points_awarded} pts)`,
    })

    sendPushToCard(card.id, {
      title: 'Izou',
      body: `Avis validé ! +${completion.points_awarded} points ⭐`,
    }).catch(() => {})

    // Update wallet
    setPendingWalletAction(card.qr_code_id, 'add')
    notifyWalletDevices(card.qr_code_id).catch(() => {})
  }

  return NextResponse.json({ status: 'approved', points_awarded: completion.points_awarded })
}
