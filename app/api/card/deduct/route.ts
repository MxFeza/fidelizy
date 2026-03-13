import { createClient } from '@/lib/supabase/server'
import { notifyWalletDevices } from '@/lib/wallet/push'
import { setPendingWalletAction } from '@/lib/wallet/generatePass'
import { NextRequest, NextResponse } from 'next/server'
import { cardWriteLimiter, getIP } from '@/lib/ratelimit'
import { atomicIncrementPoints, atomicIncrementStamps } from '@/lib/db/atomic'

export async function POST(request: NextRequest) {
  try {
    const { success } = await cardWriteLimiter.limit(getIP(request))
    if (!success) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessaie dans quelques secondes.' }, { status: 429 })
    }

    const { card_id, type, amount } = await request.json()

    if (!card_id || !type || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }

    if (type !== 'stamps' && type !== 'points') {
      return NextResponse.json({ error: 'Type invalide (stamps ou points)' }, { status: 400 })
    }

    if (!Number.isInteger(amount) || amount > 1000) {
      return NextResponse.json({ error: 'Montant invalide (entier entre 1 et 1000)' }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 })
    }

    const { data: card } = await supabase
      .from('loyalty_cards')
      .select('id, current_stamps, current_points, business_id, qr_code_id')
      .eq('id', card_id)
      .eq('business_id', business.id)
      .single()

    if (!card) {
      return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })
    }

    if (type === 'stamps') {
      // Atomic deduct (negative amount, GREATEST(0,...) in RPC prevents going below 0)
      const newStamps = await atomicIncrementStamps(supabase, card.id, -amount)

      await supabase.from('transactions').insert({
        loyalty_card_id: card.id,
        business_id: business.id,
        type: 'redeem',
        stamps_added: null,
        points_added: null,
        description: `${amount} tampon${amount > 1 ? 's' : ''} retiré${amount > 1 ? 's' : ''} (correction)`,
      })

      setPendingWalletAction(card.qr_code_id, 'deduct')

      await notifyWalletDevices(card.qr_code_id).catch((err) =>
        console.error('Wallet push error (deduct stamps):', err)
      )

      return NextResponse.json({ success: true, new_value: newStamps })
    } else {
      // Atomic deduct (negative amount, GREATEST(0,...) in RPC prevents going below 0)
      const newPoints = await atomicIncrementPoints(supabase, card.id, -amount)

      await supabase.from('transactions').insert({
        loyalty_card_id: card.id,
        business_id: business.id,
        type: 'redeem',
        stamps_added: null,
        points_added: null,
        description: `${amount} point${amount > 1 ? 's' : ''} retirés (correction)`,
      })

      setPendingWalletAction(card.qr_code_id, 'deduct')

      await notifyWalletDevices(card.qr_code_id).catch((err) =>
        console.error('Wallet push error (deduct points):', err)
      )

      return NextResponse.json({ success: true, new_value: newPoints })
    }
  } catch {
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}
