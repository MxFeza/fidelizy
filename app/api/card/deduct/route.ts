import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { cardWriteLimiter, getIP } from '@/lib/ratelimit'
import { deductFromCard } from '@/lib/services/loyalty.service'
import { AppError, withErrorHandler } from '@/lib/errors'
import { z } from 'zod'

const deductInputSchema = z.object({
  card_id: z.string().uuid(),
  type: z.enum(['stamps', 'points']),
  amount: z.coerce.number().int().positive().max(1000),
})

export const POST = withErrorHandler(async (request) => {
  const { success } = await cardWriteLimiter.limit(getIP(request))
  if (!success) throw AppError.rateLimit('Trop de requêtes. Réessaie dans quelques secondes.')

  const parsed = deductInputSchema.safeParse(await request.json())
  if (!parsed.success) throw AppError.validation('Paramètres invalides')

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) throw AppError.auth('Non autorisé')

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!business) throw AppError.notFound('Commerce introuvable')

  const { card_id, type, amount } = parsed.data
  // RPCs loyalty en service_role (TD-001 Option C 2026-05-08).
  const service = createServiceClient()
  const result = await deductFromCard(service, {
    cardId: card_id,
    businessId: business.id,
    type,
    amount,
  })

  return NextResponse.json({ success: true, new_value: result.newValue })
})
