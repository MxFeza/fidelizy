import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { cardWriteLimiter, getIP } from '@/lib/ratelimit'
import { claimReward } from '@/lib/services/loyalty.service'
import { AppError, withErrorHandler } from '@/lib/errors'
import { z } from 'zod'

const claimInputSchema = z.object({
  card_id: z.string().uuid(),
  // reward_tier_id : UUID JSONB (depuis businesses.reward_tiers). On accepte
  // aussi le palier virtuel single-tier (id = 'virtual-stamps-reward') que
  // resolveClientTiers émet en mode stamps quand aucun palier explicite.
  reward_tier_id: z.string().min(1).max(64),
})

export const POST = withErrorHandler(async (request) => {
  const { success } = await cardWriteLimiter.limit(getIP(request))
  if (!success) throw AppError.rateLimit('Trop de requêtes. Réessaie dans quelques secondes.')

  const parsed = claimInputSchema.safeParse(await request.json().catch(() => null))
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

  // RPCs loyalty en service_role (TD-001 Option C 2026-05-08).
  const service = createServiceClient()
  const result = await claimReward(service, {
    cardId: parsed.data.card_id,
    businessId: business.id,
    rewardTierId: parsed.data.reward_tier_id,
  })

  return NextResponse.json({ success: true, message: result.message, new_points: result.newPoints })
})
