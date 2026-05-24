import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { cardWriteLimiter, getIP } from '@/lib/ratelimit'
import { validateClaim } from '@/lib/services/claim.service'
import { AppError, withErrorHandler } from '@/lib/errors'
import { z } from 'zod'

// Soit un code court tape par le merchant, soit un claimId d'une notif push
// (lien direct vers la validation). On exige l'un OU l'autre via refine.
const validateClaimSchema = z
  .object({
    code: z.string().trim().min(1).optional(),
    claimId: z.string().trim().min(1).optional(),
  })
  .refine((d) => d.code || d.claimId, {
    message: 'Code ou identifiant de demande requis',
  })

/**
 * POST /api/scan/validate-claim
 *
 * Story 4.4 — Le commerçant valide un code de réclamation présenté par
 * son client. Auth merchant obligatoire (cookie SSR). Le service exécute
 * reset (stamps) ou claimReward (points) puis marque le claim 'validated'.
 *
 * Body : { code: string }
 * Returns : { success, rewardName, loyaltyType, pointsCost, cardId, customerName? }
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const { success: rateOk } = await cardWriteLimiter.limit(getIP(request))
  if (!rateOk) throw AppError.rateLimit('Trop de requêtes. Réessaie dans quelques secondes.')

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) throw AppError.auth('Non autorisé')

  const body = await request.json().catch(() => ({}))
  const parsed = validateClaimSchema.safeParse(body)
  if (!parsed.success) {
    throw AppError.validation(parsed.error.issues[0]?.message ?? 'Code ou identifiant de demande requis')
  }
  const { code = '', claimId = '' } = parsed.data

  // Verifie que l'user est bien un commerce
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', user.id)
    .single()
  if (!business) throw AppError.notFound('Commerce introuvable')

  // Toutes les opérations DB passent en service_role (RLS verrouillée)
  const service = createServiceClient()
  const result = await validateClaim(service, {
    code: code || undefined,
    claimId: claimId || undefined,
    merchantId: business.id,
  })

  return NextResponse.json(result)
})
