import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { cardWriteLimiter, getIP } from '@/lib/ratelimit'
import { createClaimRequest } from '@/lib/services/claim.service'
import { AppError, withErrorHandler } from '@/lib/errors'

/**
 * POST /api/card/[cardId]/claim-request
 *
 * Story 4.4 — Le client réclame une récompense. Génère un code 6 chars qu'il
 * présentera au commerçant pour validation. Pas d'auth user requise (la carte
 * est identifiée par son qr_code_id public, comme le scan classique).
 *
 * Body : { tierId?: string } (optionnel — null = mode stamps single-tier)
 * Returns : { id, code, rewardName, pointsCost, loyaltyType, expiresAt }
 */
export const POST = withErrorHandler(async (request: NextRequest, context?: unknown) => {
  const { success } = await cardWriteLimiter.limit(getIP(request))
  if (!success) throw AppError.rateLimit('Trop de requêtes. Réessaie dans quelques secondes.')

  const ctx = context as { params: Promise<{ cardId: string }> } | undefined
  const params = ctx?.params ? await ctx.params : { cardId: '' }
  const { cardId } = params
  if (!cardId) throw AppError.validation('cardId requis')

  const body = await request.json().catch(() => ({}))
  const tierId = typeof body?.tierId === 'string' ? body.tierId : null

  const supabase = createServiceClient()
  const result = await createClaimRequest(supabase, { cardId, tierId })

  return NextResponse.json(result)
})
