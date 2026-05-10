export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AppError, withErrorHandler } from '@/lib/errors'
import { cardWriteLimiter, getIP } from '@/lib/ratelimit'

/**
 * POST /api/business/onboarding/start
 *
 * Marque `businesses.onboarding_started_at = now()` (idempotent : ne réécrit pas
 * si déjà set). Empêche le re-affichage du modal Welcome.
 *
 * Auth : Supabase cookie SSR.
 */
export const POST = withErrorHandler(async (request) => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw AppError.auth('Non authentifié')

  const ip = getIP(request)
  const { success } = await cardWriteLimiter.limit(`onboarding-start:${user.id}:${ip}`)
  if (!success) throw AppError.rateLimit('Trop de requêtes, réessayez dans une minute.')

  const service = createServiceClient()

  // Idempotent : ne mettre à jour que si NULL.
  const { data: existing } = await service
    .from('businesses')
    .select('onboarding_started_at')
    .eq('id', user.id)
    .maybeSingle()

  if (!existing) throw AppError.notFound('Commerce introuvable')

  if (existing.onboarding_started_at !== null) {
    return NextResponse.json({ ok: true, already: true })
  }

  const { error } = await service
    .from('businesses')
    .update({ onboarding_started_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) throw error

  return NextResponse.json({ ok: true, already: false })
})
