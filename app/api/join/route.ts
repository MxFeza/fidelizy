import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { joinLimiter, getIP } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  const { success } = await joinLimiter.limit(getIP(request))
  if (!success) {
    return NextResponse.json({ error: 'Trop de requêtes. Réessaie dans quelques secondes.' }, { status: 429 })
  }

  const { businessId, firstName, phone, email } = await request.json()

  if (!businessId || !firstName || !phone || !email) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  if (typeof firstName !== 'string' || firstName.trim().length < 1 || firstName.trim().length > 100) {
    return NextResponse.json({ error: 'Prénom invalide' }, { status: 400 })
  }

  if (typeof phone !== 'string' || phone.trim().length < 6 || phone.trim().length > 20) {
    return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 })
  }

  if (typeof businessId !== 'string' || businessId.length > 100) {
    return NextResponse.json({ error: 'businessId invalide' }, { status: 400 })
  }

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
  }

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

  return NextResponse.json({ qrCodeId: newCard.qr_code_id, cardId: newCard.id })
}
