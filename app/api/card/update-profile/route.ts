import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { profileUpdateLimiter, getIP } from '@/lib/ratelimit'
import { verifyCardToken } from '@/lib/auth/cardToken'
import { AppError, withErrorHandler } from '@/lib/errors'

export const POST = withErrorHandler(async (request) => {
  const { success } = await profileUpdateLimiter.limit(getIP(request))
  if (!success) throw AppError.rateLimit('Trop de requêtes. Réessayez plus tard.')

  const { cardId, email, birthday } = await request.json()
  if (!cardId) throw AppError.validation('Paramètres manquants')

  const supabase = createServiceClient()

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id, business_id, customer_id, qr_code_id')
    .eq('id', cardId)
    .single()

  if (!card) throw AppError.notFound('Carte introuvable')

  const authToken = request.headers.get('x-card-token')
  if (!authToken || !verifyCardToken(authToken, card.qr_code_id)) {
    throw new AppError('Non autorisé', 403, 'AUTH')
  }

  if (email && typeof email === 'string') {
    const trimmedEmail = email.trim().toLowerCase()
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      await supabase
        .from('customers')
        .update({ email: trimmedEmail })
        .eq('id', card.customer_id)
        .throwOnError()
    }
  }

  if (birthday && typeof birthday === 'string') {
    await supabase
      .from('loyalty_cards')
      .update({ birthday })
      .eq('id', cardId)
      .throwOnError()
  }

  return NextResponse.json({ ok: true })
})
