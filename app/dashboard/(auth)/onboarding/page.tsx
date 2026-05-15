import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingWizard from './OnboardingWizard'
import type { Business } from '@/lib/types'

/**
 * Refonte onboarding merchant 5 etapes (2026-05-15).
 *
 * Server entrypoint :
 *   - Auth check (redirect /dashboard/login si non logue)
 *   - Charge le business + user, transmet au wizard client
 *   - Si onboarding deja complete (onboarding_completed_at != null), redirect
 *     vers /dashboard. Le user peut le refaire via "Refaire la visite" dans
 *     Profil > Aide & support (mode reset).
 *
 * Comportement interruption : si le user ferme l'app au milieu, il reviendra
 * a l'etape 1 (intro) la prochaine fois — meme si certaines donnees ont deja
 * ete persistees en DB (logo, business_type, etc.) elles ne sont pas perdues,
 * juste reaffichees a chaque etape pour confirmation.
 */
export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/dashboard/login')
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', user.id)
    .single<Business>()

  if (!business) {
    // Compte auth.users existant sans row businesses — cas tres rare
    // (registration interrompue apres signup). Re-route vers login pour
    // laisser le flow de creation se rejouer cote register page.
    redirect('/dashboard/login')
  }

  // Si onboarding deja complete (sans mode reset actif), retour direct au dashboard.
  if (business.onboarding_completed_at) {
    redirect('/dashboard')
  }

  return <OnboardingWizard initialBusiness={business} />
}
