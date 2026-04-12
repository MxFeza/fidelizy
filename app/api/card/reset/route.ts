import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cardWriteLimiter, getIP } from '@/lib/ratelimit'
import { resetCard } from '@/lib/services/loyalty.service'
import { AppError, withErrorHandler } from '@/lib/errors'

export const POST = withErrorHandler(async (request) => {
  const { success } = await cardWriteLimiter.limit(getIP(request))
  if (!success) throw AppError.rateLimit('Trop de requêtes. Réessaie dans quelques secondes.')

  const { card_id } = await request.json()
  if (!card_id) throw AppError.validation('card_id requis')

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) throw AppError.auth('Non autorisé')

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!business) throw AppError.notFound('Commerce introuvable')

  await resetCard(supabase, { cardId: card_id, businessId: business.id })

  return NextResponse.json({ success: true })
})
