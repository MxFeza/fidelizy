import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { notifyWalletDevices } from '@/lib/wallet/push'
import { setPendingWalletAction } from '@/lib/wallet/generatePass'
import { scanLimiter, getIP } from '@/lib/ratelimit'
import { sendPushToCard } from '@/lib/push/sendPush'

export async function POST(request: NextRequest) {
  try {
    const { success } = await scanLimiter.limit(getIP(request))
    if (!success) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessaie dans quelques secondes.' }, { status: 429 })
    }

    const body = await request.json()
    const { qr_code_id } = body

    if (!qr_code_id) {
      return NextResponse.json({ error: 'qr_code_id requis' }, { status: 400 })
    }

    const supabase = await createClient()

    // Vérifier l'authentification du commerçant
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // businesses.id = auth.users.id (relation 1:1)
    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 })
    }

    if (typeof qr_code_id !== 'string' || qr_code_id.length > 100) {
      return NextResponse.json({ error: 'qr_code_id invalide' }, { status: 400 })
    }

    // Trouver la carte : code court (8 chars sans tiret) ou UUID complet
    const cleaned = qr_code_id.replace(/-/g, '').replace(/[%_]/g, '')
    const isShortCode = cleaned.length === 8

    let card
    if (isShortCode) {
      // Recherche par les 8 premiers caractères du qr_code_id (ILIKE pour ignorer la casse)
      const { data } = await supabase
        .from('loyalty_cards')
        .select('*, customers(*)')
        .ilike('qr_code_id', `${cleaned}%`)
        .eq('business_id', business.id)
        .single()
      card = data
    } else {
      const { data } = await supabase
        .from('loyalty_cards')
        .select('*, customers(*)')
        .eq('qr_code_id', qr_code_id)
        .eq('business_id', business.id)
        .single()
      card = data
    }

    if (!card) {
      return NextResponse.json(
        { error: 'Carte introuvable ou ne correspond pas à ce commerce.' },
        { status: 404 }
      )
    }

    const gamification = business.gamification ?? {}
    let updatedCard
    let message = ''
    let surprise: { triggered: boolean; message?: string } = { triggered: false }

    if (business.loyalty_type === 'stamps') {
      const stampsRequired = business.stamps_required ?? 10
      let newStamps = (card.current_stamps ?? 0) + 1
      let isComplete = newStamps >= stampsRequired

      // — Surprise bonus (stamps) —
      if (
        !isComplete &&
        gamification.surprise_enabled &&
        gamification.surprise_reward_type === 'bonus_stamp'
      ) {
        const prob = gamification.surprise_probability ?? 0.2
        const bonusValue = gamification.surprise_reward_value ?? 1
        if (Math.random() < prob) {
          newStamps += bonusValue
          isComplete = newStamps >= stampsRequired

          await supabase.from('transactions').insert({
            loyalty_card_id: card.id,
            business_id: business.id,
            type: 'earn',
            stamps_added: bonusValue,
            points_added: null,
            description: `Surprise ! +${bonusValue} tampon${bonusValue > 1 ? 's' : ''} bonus`,
          })

          const surpriseMsg = `Surprise ! +${bonusValue} tampon${bonusValue > 1 ? 's' : ''} bonus aujourd'hui 🎉`
          surprise = { triggered: true, message: surpriseMsg }

          sendPushToCard(card.id, {
            title: business.business_name,
            body: surpriseMsg,
            url: `https://fidelizy.vercel.app/card/${card.qr_code_id}`,
          }).catch((err) => console.error('Surprise push error:', err))
        }
      }

      const { data } = await supabase
        .from('loyalty_cards')
        .update({
          current_stamps: isComplete ? 0 : newStamps,
          total_visits: (card.total_visits ?? 0) + 1,
          last_visit_at: new Date().toISOString(),
        })
        .eq('id', card.id)
        .select()
        .single()

      updatedCard = data

      await supabase.from('transactions').insert({
        loyalty_card_id: card.id,
        business_id: business.id,
        type: 'earn',
        stamps_added: 1,
        points_added: null,
        description: `Tampon ajouté (${newStamps}/${stampsRequired})`,
      })

      if (isComplete) {
        await supabase.from('transactions').insert({
          loyalty_card_id: card.id,
          business_id: business.id,
          type: 'redeem',
          stamps_added: null,
          points_added: null,
          description: `Récompense accordée — carte réinitialisée (${stampsRequired}/${stampsRequired})`,
        })

        message = `🎉 Carte complète ! ${card.customers?.first_name} a gagné : ${business.stamps_reward}. Carte remise à 0.`
      } else {
        message = `Tampon ajouté pour ${card.customers?.first_name} ! (${newStamps}/${stampsRequired})`
      }

      if (isComplete) {
        setPendingWalletAction(card.qr_code_id, 'add', 0)
        sendPushToCard(card.id, {
          title: business.business_name,
          body: '🎉 Récompense débloquée ! Montre ta carte au comptoir.',
          url: `https://fidelizy.vercel.app/card/${card.qr_code_id}`,
        }).catch((err) => console.error('Reward push error:', err))
      } else {
        const remaining = stampsRequired - newStamps
        setPendingWalletAction(card.qr_code_id, 'add', remaining)

        // — Goal gradient notification (stamps) —
        if (remaining === 1 && gamification.goal_gradient_notification !== false) {
          sendPushToCard(card.id, {
            title: business.business_name,
            body: 'Plus qu\'un passage et votre récompense est à vous ! 🎁',
            url: `https://fidelizy.vercel.app/card/${card.qr_code_id}`,
          }).catch((err) => console.error('Goal gradient push error:', err))
        }
      }

      await notifyWalletDevices(card.qr_code_id).catch((err) =>
        console.error('Wallet push error (stamps):', err)
      )
    } else {
      const pointsToAdd = business.points_per_euro ?? 1
      let newPoints = (card.current_points ?? 0) + pointsToAdd
      const previousPoints = card.current_points ?? 0

      // — Surprise bonus (points) —
      if (
        gamification.surprise_enabled &&
        gamification.surprise_reward_type === 'bonus_points'
      ) {
        const prob = gamification.surprise_probability ?? 0.2
        const bonusValue = gamification.surprise_reward_value ?? 1
        if (Math.random() < prob) {
          newPoints += bonusValue

          await supabase.from('transactions').insert({
            loyalty_card_id: card.id,
            business_id: business.id,
            type: 'earn',
            stamps_added: null,
            points_added: bonusValue,
            description: `Surprise ! +${bonusValue} point${bonusValue > 1 ? 's' : ''} bonus`,
          })

          const surpriseMsg = `Surprise ! +${bonusValue} point${bonusValue > 1 ? 's' : ''} bonus aujourd'hui 🎉`
          surprise = { triggered: true, message: surpriseMsg }

          sendPushToCard(card.id, {
            title: business.business_name,
            body: surpriseMsg,
            url: `https://fidelizy.vercel.app/card/${card.qr_code_id}`,
          }).catch((err) => console.error('Surprise push error:', err))
        }
      }

      const { data } = await supabase
        .from('loyalty_cards')
        .update({
          current_points: newPoints,
          total_visits: (card.total_visits ?? 0) + 1,
          last_visit_at: new Date().toISOString(),
        })
        .eq('id', card.id)
        .select()
        .single()

      updatedCard = data

      await supabase.from('transactions').insert({
        loyalty_card_id: card.id,
        business_id: business.id,
        type: 'earn',
        stamps_added: null,
        points_added: pointsToAdd,
        description: `${pointsToAdd} points ajoutés`,
      })

      message = `+${pointsToAdd} pts pour ${card.customers?.first_name} ! Total : ${newPoints} pts`

      // Check if a reward tier threshold was just reached
      const { data: reachedTiers } = await supabase
        .from('reward_tiers')
        .select('points_required')
        .eq('business_id', business.id)
        .gt('points_required', previousPoints)
        .lte('points_required', newPoints)
        .limit(1)

      if (reachedTiers && reachedTiers.length > 0) {
        sendPushToCard(card.id, {
          title: business.business_name,
          body: '🎉 Récompense débloquée ! Montre ta carte au comptoir.',
          url: `https://fidelizy.vercel.app/card/${card.qr_code_id}`,
        }).catch((err) => console.error('Reward push error:', err))
      } else if (gamification.goal_gradient_notification !== false) {
        // — Goal gradient notification (points) —
        const { data: nextTier } = await supabase
          .from('reward_tiers')
          .select('points_required')
          .eq('business_id', business.id)
          .gt('points_required', newPoints)
          .order('points_required', { ascending: true })
          .limit(1)

        if (nextTier && nextTier.length > 0) {
          const distance = nextTier[0].points_required - newPoints
          if (distance <= 2) {
            sendPushToCard(card.id, {
              title: business.business_name,
              body: `Plus que ${distance} point${distance > 1 ? 's' : ''} et votre récompense est à vous ! 🎁`,
              url: `https://fidelizy.vercel.app/card/${card.qr_code_id}`,
            }).catch((err) => console.error('Goal gradient push error:', err))
          }
        }
      }

      setPendingWalletAction(card.qr_code_id, 'add')

      await notifyWalletDevices(card.qr_code_id).catch((err) =>
        console.error('Wallet push error (points):', err)
      )
    }

    return NextResponse.json({
      success: true,
      customer: card.customers,
      card: updatedCard,
      message,
      ...(surprise.triggered && { surprise }),
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}
