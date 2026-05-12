import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { cardWriteLimiter, getIP } from '@/lib/ratelimit'
import { createClaimRequest } from '@/lib/services/claim.service'
import { AppError, withErrorHandler } from '@/lib/errors'
import { z } from 'zod'

/**
 * POST /api/card/[cardId]/claim-request
 *
 * Story 4.4 — Le client réclame une récompense. Génère un code 6 chars qu'il
 * présentera au commerçant pour validation. Pas d'auth user requise (la carte
 * est identifiée par son qr_code_id public, comme le scan classique).
 *
 * Body : { tierId?: string | null } (optionnel — null = mode stamps single-tier)
 * Returns : { id, code, rewardName, pointsCost, loyaltyType, expiresAt }
 */
const bodySchema = z.object({
  // tierId : UUID JSONB ou 'virtual-stamps-reward' (single-tier). null/absent
  // → le service choisit le palier principal (mode stamps).
  tierId: z.string().min(1).max(64).nullable().optional(),
})

// qr_code_id format (cf. lib/qr-codes.ts) : alphanumérique de 4 à 64 char,
// dashes et underscores acceptés. Empêche l'injection de chemins arbitraires.
const cardIdSchema = z.string().regex(/^[A-Za-z0-9=_-]{4,64}$/)

export const POST = withErrorHandler(async (request: NextRequest, context?: unknown) => {
  const { success } = await cardWriteLimiter.limit(getIP(request))
  if (!success) throw AppError.rateLimit('Trop de requêtes. Réessaie dans quelques secondes.')

  const ctx = context as { params: Promise<{ cardId: string }> } | undefined
  const params = ctx?.params ? await ctx.params : { cardId: '' }
  const cardIdParsed = cardIdSchema.safeParse(params.cardId)
  if (!cardIdParsed.success) throw AppError.validation('cardId invalide')

  const bodyParsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!bodyParsed.success) throw AppError.validation('Paramètres invalides')

  const supabase = createServiceClient()
  const result = await createClaimRequest(supabase, {
    cardId: cardIdParsed.data,
    tierId: bodyParsed.data.tierId ?? null,
  })

  return NextResponse.json(result)
})
