import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AppError, withErrorHandler } from '@/lib/errors'

/**
 * POST /api/me/onboarding/pwa-installed — marque la PWA comme installée.
 *
 * Idempotent : si `pwa_installed_at` est déjà set, on ne le réécrit pas.
 * Story 9.2.
 */
export const POST = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || !user.email || authError) throw AppError.auth('Non autorisé')

  const service = createServiceClient()
  const { data: customer } = await service
    .from('customers')
    .select('id, pwa_installed_at')
    .eq('email', user.email)
    .maybeSingle()
  if (!customer) throw AppError.notFound('Profil introuvable')

  if (customer.pwa_installed_at) {
    return NextResponse.json({ ok: true, pwa_installed_at: customer.pwa_installed_at })
  }

  const now = new Date().toISOString()
  const { error } = await service
    .from('customers')
    .update({ pwa_installed_at: now })
    .eq('id', customer.id)
  if (error) throw new AppError('Erreur lors de la mise à jour', 500)

  return NextResponse.json({ ok: true, pwa_installed_at: now })
})
