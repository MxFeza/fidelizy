import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from './Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import MobileHeader from '@/components/dashboard/MobileHeader'
import FeedbackBubble from '@/components/dashboard/FeedbackBubble'
// Story 9.1 — OnboardingCoach est un client component ('use client'). On l'importe
// directement (pas via next/dynamic) — Next 16 ne permet plus ssr:false dans
// un Server Component, et l'isomorphisme est géré par le composant lui-même.
import OnboardingCoach from '@/components/dashboard/onboarding/OnboardingCoach'
import PostOnboardingTour from '@/components/dashboard/onboarding/PostOnboardingTour'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/dashboard/login')
  }

  // businesses.id = auth.users.id (relation 1:1)
  const { data: business } = await supabase
    .from('businesses')
    .select(
      'id, business_name, primary_color, logo_url, first_name, business_type, onboarding_started_at, onboarding_completed_at',
    )
    .eq('id', user.id)
    .single()

  // Refonte 2026-05-14 — onboarding 5 etapes obligatoire (Intro → Metier →
  // Carte → Paliers → Apercu). Tant que `onboarding_completed_at` est NULL,
  // on force le retour a /dashboard/onboarding pour garantir un commercant
  // qui sort de l'onboarding avec un programme fideleite operationnel.
  //
  // Pour les comptes legacy crees avant la refonte, la migration
  // 20260515_seed_onboarding_completed_at backfill ce flag a partir de la
  // presence de business_type (ils ont deja passe l'ancien flow simplifie).
  if (business && (!business.business_type || !business.onboarding_completed_at)) {
    redirect('/dashboard/onboarding')
  }

  const businessName = business?.business_name ?? 'Mon Commerce'

  // Story 9.1 — décide quoi afficher côté coach onboarding.
  const onboardingStarted = !!business?.onboarding_started_at
  const onboardingCompleted = !!business?.onboarding_completed_at
  // Prénom pour le wording enthousiaste : 1ʳᵉ source = first_name (settings),
  // fallback = 1er mot du business_name.
  const firstName =
    (business?.first_name?.trim() ?? '') ||
    (business?.business_name?.split(/\s+/)[0] ?? '')

  return (
    <div className="flex h-screen bg-primary">
      <Sidebar
        businessName={businessName}
        businessEmail={user.email}
        businessLogoUrl={business?.logo_url}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader />
        <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
      </div>
      <BottomNav businessName={businessName} />
      <FeedbackBubble />

      {/* Story 9.1 — Coach onboarding commerçant. Depuis la refonte 2026-05-15
          de l'onboarding 5 etapes, cette checklist est obsolete (l'onboarding
          configure deja tout). Conservee defensivement pour les comptes
          legacy qui n'auraient pas onboarding_completed_at — mais en pratique
          la migration 20260515_seed_onboarding_completed_at backfill ce flag. */}
      {!onboardingCompleted && (
        <OnboardingCoach
          firstName={firstName}
          showWelcome={!onboardingStarted}
          showChecklist={onboardingStarted}
        />
      )}

      {/* Mini-tour post-onboarding 5 etapes (refonte 2026-05-15). Self-gated
          via sessionStorage / query param ?tour=welcome. */}
      <PostOnboardingTour />
    </div>
  )
}
