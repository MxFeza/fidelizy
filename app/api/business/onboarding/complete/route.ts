export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AppError, withErrorHandler } from '@/lib/errors'
import { cardWriteLimiter, getIP } from '@/lib/ratelimit'

/**
 * POST /api/business/onboarding/complete
 *
 * Body :
 *   - {}                     → marque `onboarding_completed_at = now()` (idempotent)
 *   - { "reset": true }      → reset `onboarding_completed_at = NULL` (re-affiche le widget)
 *
 * Le mode reset alimente le bouton "Refaire la visite" dans Profil > Aide & support.
 */
export const POST = withErrorHandler(async (request) => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw AppError.auth('Non authentifié')

  const ip = getIP(request)
  const { success } = await cardWriteLimiter.limit(`onboarding-complete:${user.id}:${ip}`)
  if (!success) throw AppError.rateLimit('Trop de requêtes, réessayez dans une minute.')

  // Body optionnel : tolère JSON vide ou absent.
  let body: { reset?: boolean } = {}
  try {
    const text = await request.text()
    if (text.trim()) body = JSON.parse(text)
  } catch {
    // Body invalide → on traite comme {} (mode complete classique)
  }

  const service = createServiceClient()

  const { data: existing } = await service
    .from('businesses')
    .select('onboarding_completed_at')
    .eq('id', user.id)
    .maybeSingle()

  if (!existing) throw AppError.notFound('Commerce introuvable')

  if (body.reset === true) {
    // Mode "Refaire la visite" : reset les 2 flags onboarding_started_at et
    // onboarding_completed_at → la modal Welcome re-apparaît au prochain
    // /dashboard load + checklist re-visible + tour relançable. Les autres
    // timestamps de tâches (qr_printed_at, notif_setup_at) sont conservés
    // pour ne pas faire perdre les actions déjà accomplies.
    const { error } = await service
      .from('businesses')
      .update({
        onboarding_started_at: null,
        onboarding_completed_at: null,
      })
      .eq('id', user.id)
    if (error) throw error
    return NextResponse.json({ ok: true, mode: 'reset' })
  }

  // Mode complete classique (idempotent).
  if (existing.onboarding_completed_at !== null) {
    return NextResponse.json({ ok: true, already: true, mode: 'complete' })
  }

  const { error } = await service
    .from('businesses')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) throw error

  return NextResponse.json({ ok: true, already: false, mode: 'complete' })
})
