import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { joinLimiter, getIP } from '@/lib/ratelimit'
import { findCardByReferralCode } from '@/lib/referral'
import { sendPushToCard } from '@/lib/push/sendPush'
import { notifyWalletDevices } from '@/lib/wallet/push'
import { setPendingWalletAction } from '@/lib/wallet/generatePass'
import { parseBody, joinBodySchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  const { success } = await joinLimiter.limit(getIP(request))
  if (!success) {
    return NextResponse.json({ error: 'Trop de requêtes. Réessaie dans quelques secondes.' }, { status: 429 })
  }

  const parsed = await parseBody(request, joinBodySchema)
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }
  const { businessId, firstName, phone, email, referral_code } = parsed.data

  const supabase = createServiceClient()

  // Load business to check gamification config
  const { data: business } = await supabase
    .from('businesses')
    .select('id, loyalty_type, gamification')
    .eq('id', businessId)
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 })
  }

  // Check if customer with this phone already exists
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', phone)
    .maybeSingle()

  let customerId: string

  if (existingCustomer) {
    customerId = existingCustomer.id

    // Check if they already have a card for this business
    const { data: existingCard } = await supabase
      .from('loyalty_cards')
      .select('id, qr_code_id')
      .eq('customer_id', customerId)
      .eq('business_id', businessId)
      .maybeSingle()

    if (existingCard) {
      return NextResponse.json({ qrCodeId: existingCard.qr_code_id, cardId: existingCard.id })
    }
  } else {
    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({ first_name: firstName, phone, email: email.trim().toLowerCase() })
      .select('id')
      .single()

    if (customerError || !newCustomer) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du profil' },
        { status: 500 }
      )
    }

    customerId = newCustomer.id
  }

  const initialStamps = (business.loyalty_type === 'stamps' && business.gamification?.initial_stamps) || 0

  const qrCodeId = crypto.randomUUID()
  const { data: newCard, error: cardError } = await supabase
    .from('loyalty_cards')
    .insert({
      customer_id: customerId,
      business_id: businessId,
      current_stamps: initialStamps,
      current_points: 0,
      total_visits: 0,
      qr_code_id: qrCodeId,
      rgpd_consent_at: new Date().toISOString(),
    })
    .select('id, qr_code_id')
    .single()

  if (cardError || !newCard) {
    return NextResponse.json(
      { error: 'Erreur lors de la création de la carte' },
      { status: 500 }
    )
  }

  // Log initial bonus stamps as a transaction
  if (initialStamps > 0) {
    await supabase.from('transactions').insert({
      loyalty_card_id: newCard.id,
      business_id: businessId,
      type: 'earn',
      stamps_added: initialStamps,
      points_added: null,
      description: `Bonus de bienvenue : ${initialStamps} tampon${initialStamps > 1 ? 's' : ''}`,
    })
  }

  // Handle referral
  if (referral_code && typeof referral_code === 'string') {
    try {
      const referrerCard = await findCardByReferralCode(referral_code, businessId, supabase)
      if (referrerCard) {
        // Check if referral mission is active for this business
        const { data: referralMission } = await supabase
          .from('missions')
          .select('id, reward_points, config')
          .eq('business_id', businessId)
          .eq('template_key', 'referral')
          .eq('is_active', true)
          .maybeSingle()

        const referrerPoints = referralMission?.reward_points ?? 5
        const referredPoints = (referralMission?.config as Record<string, unknown>)?.referred_bonus as number ?? 2

        // Create referral entry
        await supabase.from('referrals').insert({
          referrer_card_id: referrerCard.id,
          referred_card_id: newCard.id,
          business_id: businessId,
          referrer_points_awarded: referralMission ? referrerPoints : 0,
          referred_points_awarded: referralMission ? referredPoints : 0,
        })

        if (referralMission) {
          // Update referrer card points
          const { data: refCard } = await supabase
            .from('loyalty_cards')
            .select('current_points, qr_code_id')
            .eq('id', referrerCard.id)
            .single()

          if (refCard) {
            await supabase
              .from('loyalty_cards')
              .update({ current_points: refCard.current_points + referrerPoints })
              .eq('id', referrerCard.id)

            await supabase.from('transactions').insert({
              loyalty_card_id: referrerCard.id,
              business_id: businessId,
              type: 'earn',
              stamps_added: null,
              points_added: referrerPoints,
              description: `Parrainage : ${firstName} vous a rapporté ${referrerPoints} points`,
            })

            // Create mission completion for referrer
            await supabase.from('mission_completions').insert({
              card_id: referrerCard.id,
              mission_id: referralMission.id,
              status: 'completed',
              points_awarded: referrerPoints,
            })
          }

          // Credit referred (new card)
          await supabase
            .from('loyalty_cards')
            .update({ current_points: (newCard as unknown as { current_points?: number }).current_points ?? 0 + referredPoints })
            .eq('id', newCard.id)

          // Actually we need to re-read current_points or just set it
          await supabase
            .from('loyalty_cards')
            .update({ current_points: referredPoints })
            .eq('id', newCard.id)

          await supabase.from('transactions').insert({
            loyalty_card_id: newCard.id,
            business_id: businessId,
            type: 'earn',
            stamps_added: null,
            points_added: referredPoints,
            description: `Bonus de parrainage : +${referredPoints} points`,
          })

          // Push notification to referrer
          sendPushToCard(referrerCard.id, {
            title: 'Izou',
            body: `Parrainage réussi ! Votre ami ${firstName} vous a rapporté ${referrerPoints} points ! 🤝`,
          }).catch(() => {})

          // Wallet update for referrer
          if (refCard?.qr_code_id) {
            setPendingWalletAction(refCard.qr_code_id, 'add')
            notifyWalletDevices(refCard.qr_code_id).catch(() => {})
          }

          // Push notification to referred (filleul)
          sendPushToCard(newCard.id, {
            title: 'Izou',
            body: `Bienvenue ! ${referredPoints} points offerts grâce au parrainage 🎁`,
          }).catch(() => {})

          // Wallet update for referred
          setPendingWalletAction(newCard.qr_code_id, 'add')
          notifyWalletDevices(newCard.qr_code_id).catch(() => {})
        }
      }
    } catch {
      // Ignore referral errors — don't block registration
    }
  }

  return NextResponse.json({ qrCodeId: newCard.qr_code_id, cardId: newCard.id })
}
