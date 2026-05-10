export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AppError, withErrorHandler } from '@/lib/errors'
import { cardWriteLimiter, getIP } from '@/lib/ratelimit'

/**
 * POST /api/business/onboarding/notif-setup
 *
 * Marque `businesses.notif_setup_at = now()` (idempotent). Coche la tâche 6
 * de la checklist d'onboarding ("Activer les notifications push").
 */
export const POST = withErrorHandler(async (request) => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw AppError.auth('Non authentifié')

  const ip = getIP(request)
  const { success } = await cardWriteLimiter.limit(`onboarding-notif:${user.id}:${ip}`)
  if (!success) throw AppError.rateLimit('Trop de requêtes, réessayez dans une minute.')

  const service = createServiceClient()

  const { data: existing } = await service
    .from('businesses')
    .select('notif_setup_at')
    .eq('id', user.id)
    .maybeSingle()

  if (!existing) throw AppError.notFound('Commerce introuvable')

  if (existing.notif_setup_at !== null) {
    return NextResponse.json({ ok: true, already: true })
  }

  const { error } = await service
    .from('businesses')
    .update({ notif_setup_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) throw error

  return NextResponse.json({ ok: true, already: false })
})
