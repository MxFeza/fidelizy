'use client'

/**
 * PostOnboardingTour — mini-tour 3-5 coachmarks lancee juste apres la
 * completion de l'onboarding initial 5 etapes (refonte 2026-05-15).
 *
 * Trigger : sessionStorage 'izou.post-onboarding-tour' OU query param
 * ?tour=welcome. Le wizard set les 2 avant de redirect vers /dashboard.
 *
 * Le tour se compose de 5 coachmarks (advance manuel) qui briefent les
 * sections principales du dashboard. Il est volontairement court et
 * non-bloquant — l'utilisateur peut le fermer a tout moment via croix
 * ou Escape.
 *
 * Distinct de OnboardingCoach (Story 9.1) qui gere une checklist
 * persistante de taches. Depuis la refonte, la checklist 9.1 est
 * desactivee car redondante (l'onboarding 5 etapes configure deja tout).
 * OnboardingCoach se desactive automatiquement quand
 * `onboarding_completed_at IS NOT NULL`.
 */

import { useEffect, useLayoutEffect, useMemo, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Compass01, Users01, BarChartSquareUp, Gift01, Bell01, MessageChatCircle, Send03 } from '@untitledui/icons'
import Coachmark, { type CoachmarkStep } from './Coachmark'

// Tour desktop : cible la Sidebar (md:flex) + sous-menu Marketing
const TOUR_STEPS_DESKTOP: CoachmarkStep[] = [
  {
    id: 'sidebar',
    targetSelector: '[data-tour="sidebar"]',
    icon: Compass01,
    title: 'Voici tes outils principaux',
    description: 'La navigation regroupe tout : clients, marketing, réglages. Tu y reviendras souvent.',
    advanceOn: 'manual',
  },
  {
    id: 'clients',
    targetSelector: '[href="/dashboard/clients"]',
    icon: Users01,
    title: 'Tes clients en un coup d\'œil',
    description: 'Ici tu suis tes habitués, leur activité, et tu peux relancer ceux qui s\'éloignent.',
    advanceOn: 'manual',
  },
  {
    id: 'kpis',
    targetSelector: '[data-tour="dashboard-kpis"]',
    icon: BarChartSquareUp,
    title: 'Aperçu temps réel',
    description: 'Visites, taux de retour, clients actifs : ton activité en direct.',
    advanceOn: 'manual',
  },
  {
    id: 'loyalty',
    targetSelector: '[href="/dashboard/marketing/loyalty"]',
    icon: Gift01,
    title: 'Ton programme de fidélité',
    description: 'Tu peux ajuster les paliers, la récompense, le nombre de tampons à tout moment.',
    advanceOn: 'manual',
  },
  {
    id: 'push',
    targetSelector: '[href="/dashboard/marketing/push"]',
    icon: Bell01,
    title: 'Push notifications',
    description: 'Envoie une notif à tes clients pour les fidéliser — promo flash, nouveauté, anniv.',
    advanceOn: 'manual',
  },
  {
    id: 'feedback',
    targetSelector: '[data-tour="feedback-cta"]',
    icon: MessageChatCircle,
    title: 'Aide-nous à améliorer Izou',
    description: 'Tu es en beta — un bug, une idée, un doute ? Ce bouton nous envoie ton retour directement. On lit tout.',
    advanceOn: 'manual',
  },
]

// Tour mobile : cible la BottomNav (md:hidden) + FeedbackBubble flottante.
// Marketing reste agrege (pas de sous-menu mobile, faut taper pour deplier).
// Retour user 2026-05-22 — la version desktop pointait dans le vide sur mobile.
const TOUR_STEPS_MOBILE: CoachmarkStep[] = [
  {
    id: 'bottomnav',
    targetSelector: '[data-tour="bottomnav"]',
    icon: Compass01,
    title: 'Tes raccourcis principaux',
    description: 'Cette barre du bas te suit partout : tableau de bord, clients, marketing, ton espace.',
    advanceOn: 'manual',
  },
  {
    id: 'clients-mobile',
    targetSelector: '[data-tour="bottomnav-clients"]',
    icon: Users01,
    title: 'Tes clients en un coup d\'œil',
    description: 'Retrouve ici tes habitués et relance ceux qui s\'éloignent.',
    advanceOn: 'manual',
  },
  {
    id: 'kpis',
    targetSelector: '[data-tour="dashboard-kpis"]',
    icon: BarChartSquareUp,
    title: 'Aperçu temps réel',
    description: 'Visites, taux de retour, clients actifs : ton activité en direct.',
    advanceOn: 'manual',
  },
  {
    id: 'marketing-mobile',
    targetSelector: '[data-tour="bottomnav-marketing"]',
    icon: Send03,
    title: 'Programme fidélité & push',
    description: 'Ajuste tes paliers, récompenses, et envoie des notifications à tes clients depuis ici.',
    advanceOn: 'manual',
  },
  {
    id: 'feedback',
    targetSelector: '[data-tour="feedback-cta"]',
    icon: MessageChatCircle,
    title: 'Aide-nous à améliorer Izou',
    description: 'Tu es en beta — un bug, une idée, un doute ? Cette bulle nous envoie ton retour directement.',
    advanceOn: 'manual',
  },
]

// Detection mobile reactive (resize-aware). Pas SSR : la valeur initiale est
// false (= desktop) et est rectifiee au mount client-side avant le render
// effectif du Coachmark (active=false par defaut).
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < breakpoint)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])
  return isMobile
}

export default function PostOnboardingTour() {
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useIsMobile()
  // useMemo pour stabiliser la ref entre renders (sans, les useCallback /
  // useLayoutEffect en dessous se redeclencheraient a chaque render).
  const TOUR_STEPS = useMemo(
    () => (isMobile ? TOUR_STEPS_MOBILE : TOUR_STEPS_DESKTOP),
    [isMobile],
  )
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const queryActive = url.searchParams.get('tour') === 'welcome'
    const sessionActive = sessionStorage.getItem('izou.post-onboarding-tour') === '1'

    if (queryActive || sessionActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- check client-side state apres hydration (sessionStorage + window.location)
      setActive(true)
      setStepIndex(0)
    }
  }, [pathname])

  const finish = useCallback(() => {
    setActive(false)
    if (typeof window === 'undefined') return
    sessionStorage.removeItem('izou.post-onboarding-tour')
    const url = new URL(window.location.href)
    if (url.searchParams.get('tour')) {
      url.searchParams.delete('tour')
      const qs = url.searchParams.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    }
  }, [pathname, router])

  const advance = useCallback(() => {
    setStepIndex((idx) => {
      if (idx + 1 >= TOUR_STEPS.length) {
        finish()
        return 0
      }
      return idx + 1
    })
  }, [finish, TOUR_STEPS.length])

  const prev = useCallback(() => {
    setStepIndex((idx) => Math.max(0, idx - 1))
  }, [])

  // Avant chaque step, ouvre le <details> parent du target si necessaire.
  // Sinon le coachmark se positionne au mauvais endroit (sous-menu Marketing
  // ferme par defaut → loyalty/push pointent dans le vide).
  // useLayoutEffect = avant la phase de paint, pour que Coachmark calcule
  // sa position sur un target deja visible.
  useLayoutEffect(() => {
    if (!active) return
    const currentStep = TOUR_STEPS[stepIndex]
    if (!currentStep?.targetSelector) return
    const target = document.querySelector(currentStep.targetSelector)
    if (!target) return
    const parentDetails = target.closest('details')
    if (parentDetails && !parentDetails.open) {
      parentDetails.open = true
    }
  }, [active, stepIndex, TOUR_STEPS])

  if (!active) return null

  const step = TOUR_STEPS[stepIndex]
  if (!step) return null

  return (
    <Coachmark
      key={step.id}
      step={step}
      current={stepIndex + 1}
      total={TOUR_STEPS.length}
      onAdvance={advance}
      onClose={finish}
      onPrev={stepIndex > 0 ? prev : undefined}
    />
  )
}
