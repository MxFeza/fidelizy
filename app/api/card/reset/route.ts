import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { cardWriteLimiter, getIP } from '@/lib/ratelimit'
import { resetCard } from '@/lib/services/loyalty.service'
import { AppError, withErrorHandler } from '@/lib/errors'
import { z } from 'zod'

const resetInputSchema = z.object({
  card_id: z.string().uuid(),
})

export const POST = withErrorHandler(async (request) => {
  const { success } = await cardWriteLimiter.limit(getIP(request))
  if (!success) throw AppError.rateLimit('Trop de requêtes. Réessaie dans quelques secondes.')

  const parsed = resetInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw AppError.validation('card_id invalide')

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) throw AppError.auth('Non autorisé')

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!business) throw AppError.notFound('Commerce introuvable')

  // RPCs loyalty en service_role (TD-001 Option C 2026-05-08).
  const service = createServiceClient()
  await resetCard(service, { cardId: parsed.data.card_id, businessId: business.id })

  return NextResponse.json({ success: true })
})
