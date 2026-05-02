import { createClient as createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { AppError, withErrorHandler } from '@/lib/errors'
import crypto from 'crypto'

/**
 * POST /api/me/add-card — Ajouter une carte fidelite via code court commercant
 * (Story 4.10.b).
 *
 * Body : { short_code: string }
 *
 * Comportement :
 *  - Auth client requise (cookie session via /me)
 *  - Lookup business par short_code (6 chars alphanum)
 *  - Si client a deja une carte chez ce commerce -> retourne carte existante
 *  - Sinon : INSERT loyalty_card + retourne qr_code_id pour redirect
 */
export const POST = withErrorHandler(async (request) => {
  const body = await request.json().catch(() => ({}))
  const code = typeof body.short_code === 'string' ? body.short_code.trim().toUpperCase() : ''

  if (!code || code.length < 4) {
    throw AppError.validation('Code commerçant invalide.')
  }

  // Auth check
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) throw AppError.auth('Non autorisé. Connectez-vous.')

  const service = createServiceClient()

  // Lookup customer
  const { data: customer } = await service
    .from('customers')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()

  if (!customer) {
    throw AppError.auth('Compte client introuvable. Reconnectez-vous.')
  }

  // Lookup business by short_code
  const { data: business } = await service
    .from('businesses')
    .select('id, business_name, is_active')
    .eq('short_code', code)
    .maybeSingle()

  if (!business) {
    return NextResponse.json(
      { status: 'not_found', error: 'Aucun commerce trouvé avec ce code.' },
      { status: 404 }
    )
  }

  if (business.is_active === false) {
    return NextResponse.json(
      { status: 'inactive', error: 'Ce commerce n\'est plus actif.' },
      { status: 400 }
    )
  }

  // Check if customer already has a card at this business
  const { data: existing } = await service
    .from('loyalty_cards')
    .select('qr_code_id')
    .eq('customer_id', customer.id)
    .eq('business_id', business.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({
      status: 'already_exists',
      qr_code_id: existing.qr_code_id,
      business_name: business.business_name,
      message: `Vous avez déjà une carte chez ${business.business_name}.`,
    })
  }

  // Create new loyalty_card
  const qrCodeId = crypto.randomUUID()
  const { data: newCard, error: insertError } = await service
    .from('loyalty_cards')
    .insert({
      business_id: business.id,
      customer_id: customer.id,
      qr_code_id: qrCodeId,
      current_stamps: 0,
      current_points: 0,
      points_multiplier: 1,
      is_active: true,
    })
    .select('qr_code_id')
    .single()

  if (insertError || !newCard) {
    console.error('Card creation error:', insertError)
    throw new AppError('Erreur lors de la création de la carte.', 500)
  }

  return NextResponse.json({
    status: 'created',
    qr_code_id: newCard.qr_code_id,
    business_name: business.business_name,
  })
})
