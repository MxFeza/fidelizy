import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import Sidebar from './Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import MobileHeader from '@/components/dashboard/MobileHeader'
import FeedbackBubble from '@/components/dashboard/FeedbackBubble'

// Story 9.1 — OnboardingCoach (modal welcome + checklist + tour driver.js).
// Chargé en client-only (driver.js manipule le DOM).
const OnboardingCoach = dynamic(
  () => import('@/components/dashboard/onboarding/OnboardingCoach'),
  { ssr: false },
)

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
      'id, business_name, primary_color, logo_url, first_name, onboarding_started_at, onboarding_completed_at',
    )
    .eq('id', user.id)
    .single()

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

      {/* Story 9.1 — Coach onboarding commerçant. Mounted seulement si la 1ʳᵉ
          étape (welcome) n'est pas faite OU si la checklist n'est pas à 100%. */}
      {!onboardingCompleted && (
        <OnboardingCoach
          firstName={firstName}
          showWelcome={!onboardingStarted}
          showChecklist={onboardingStarted}
        />
      )}
    </div>
  )
}
