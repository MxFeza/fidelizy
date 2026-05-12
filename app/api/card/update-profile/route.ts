import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { profileUpdateLimiter, getIP } from '@/lib/ratelimit'
import { verifyCardToken } from '@/lib/auth/cardToken'
import { AppError, withErrorHandler } from '@/lib/errors'
import { z } from 'zod'

// cardId ici est l'UUID interne de la table loyalty_cards (pas le qr_code_id).
// email : optionnel, format strict (server-side même check qu'avant + Zod).
// birthday : optionnel, ISO date YYYY-MM-DD pour éviter qu'un client envoie
// un timestamp ou une string libre stockée telle quelle.
const inputSchema = z.object({
  cardId: z.string().uuid(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .max(254)
    .optional()
    .or(z.literal('')),
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal('')),
})

export const POST = withErrorHandler(async (request) => {
  const { success } = await profileUpdateLimiter.limit(getIP(request))
  if (!success) throw AppError.rateLimit('Trop de requêtes. Réessayez plus tard.')

  const parsed = inputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw AppError.validation('Paramètres invalides')
  const { cardId, email, birthday } = parsed.data

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

  if (email) {
    await supabase
      .from('customers')
      .update({ email })
      .eq('id', card.customer_id)
      .throwOnError()
  }

  if (birthday) {
    await supabase
      .from('loyalty_cards')
      .update({ birthday })
      .eq('id', cardId)
      .throwOnError()
  }

  return NextResponse.json({ ok: true })
})
