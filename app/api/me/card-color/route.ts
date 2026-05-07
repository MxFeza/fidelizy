import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AppError, withErrorHandler } from '@/lib/errors'
import { profileUpdateLimiter, getIP } from '@/lib/ratelimit'

const schema = z.object({
  color: z.enum(['violet', 'orange', 'jaune', 'corail', 'vert']).nullable(),
})

/**
 * PATCH /api/me/card-color — change la couleur de carte du client.
 * Body : { color: 'violet'|'orange'|'jaune'|'corail'|'vert' | null }
 * null = retour au noir default. Story 4.7 v2 P1.5.
 */
export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || !user.email || authError) throw AppError.auth('Non autorisé')

  const ip = getIP(request)
  const { success } = await profileUpdateLimiter.limit(`card-color:${user.id}:${ip}`)
  if (!success) throw AppError.rateLimit('Trop de mises à jour. Réessayez plus tard.')

  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) throw AppError.validation('Couleur invalide')

  const service = createServiceClient()
  const { error } = await service
    .from('customers')
    .update({ card_color: parsed.data.color })
    .eq('email', user.email)
  if (error) throw new AppError('Erreur lors de la mise à jour', 500)

  return NextResponse.json({ ok: true, card_color: parsed.data.color })
})
