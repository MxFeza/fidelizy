import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AppError, withErrorHandler } from '@/lib/errors'

/**
 * POST /api/me/onboarding/complete — marque l'onboarding comme terminé.
 *
 * Appelé quand 3/3 tâches faites — fait disparaître le banner.
 * Idempotent : si `onboarding_completed_at` est déjà set, on ne le réécrit pas.
 * Story 9.2.
 */
export const POST = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || !user.email || authError) throw AppError.auth('Non autorisé')

  const service = createServiceClient()
  const { data: customer } = await service
    .from('customers')
    .select('id, onboarding_completed_at')
    .eq('email', user.email)
    .maybeSingle()
  if (!customer) throw AppError.notFound('Profil introuvable')

  if (customer.onboarding_completed_at) {
    return NextResponse.json({ ok: true, completed_at: customer.onboarding_completed_at })
  }

  const now = new Date().toISOString()
  const { error } = await service
    .from('customers')
    .update({ onboarding_completed_at: now })
    .eq('id', customer.id)
  if (error) throw new AppError('Erreur lors de la mise à jour', 500)

  return NextResponse.json({ ok: true, completed_at: now })
})
