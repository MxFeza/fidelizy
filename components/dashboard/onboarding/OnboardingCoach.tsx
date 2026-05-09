'use client'

/**
 * Story 9.1 — Orchestrateur d'activation coach commerçant.
 *
 * Mounted dans `app/dashboard/(protected)/layout.tsx`. Coordonne :
 *   1. Modal Welcome 1ᵉʳ login (OnboardingWelcomeModal)
 *   2. Widget checklist persistant en sidebar (OnboardingChecklist)
 *   3. Mini-tours driver.js contextuels (onboardingTour.ts)
 *   4. Célébration 100% (Confetti + modal félicitations)
 *
 * Au montage : fetch /api/business/onboarding/status pour décider quoi afficher.
 *
 * Le widget checklist est rendu via portal/teleport dans la sidebar via
 * un slot `<div id="onboarding-slot" />`. Si le slot n'existe pas (mobile),
 * la checklist se rend inline (mobile : sous le contenu, en bas).
 */

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import OnboardingWelcomeModal from './OnboardingWelcomeModal'
import OnboardingChecklist from './OnboardingChecklist'
import OnboardingCompleteModal from './OnboardingCompleteModal'
import { runMerchantTour } from './onboardingTour'
import type { MerchantOnboardingTaskId } from '@/lib/onboarding/getMerchantTaskStatus'

interface OnboardingCoachProps {
  /** Prénom du gérant (depuis layout server). */
  firstName: string
  /** True si `businesses.onboarding_started_at IS NULL` (modal welcome à afficher). */
  showWelcome: boolean
  /** True si `businesses.onboarding_started_at IS NOT NULL` ET completed_at IS NULL. */
  showChecklist: boolean
}

export default function OnboardingCoach({
  firstName,
  showWelcome,
  showChecklist,
}: OnboardingCoachProps) {
  const [welcomeOpen, setWelcomeOpen] = useState(showWelcome)
  // Une fois le modal welcome cliqué (Commencer ou Plus tard), la checklist
  // doit s'afficher même si la prop initiale était false. Le toggle de cet
  // état local est local au lifecycle "session courante".
  const [checklistShownLocally, setChecklistShownLocally] = useState(showChecklist)
  const [checklistVersion, setChecklistVersion] = useState(0)
  const [celebrationOpen, setCelebrationOpen] = useState(false)
  const [slotEl, setSlotEl] = useState<Element | null>(null)
  const completeMarkedRef = useRef(false)

  // Cherche le slot sidebar après mount (côté client uniquement → évite SSR mismatch).
  useEffect(() => {
    const el = document.querySelector('[data-onboarding-slot]')
    setSlotEl(el)
  }, [])

  /**
   * Au clic sur "Commencer la visite" du modal welcome, on lance le tour
   * contextuel sur l'onglet Marketing > Fidélité (= 1ʳᵉ tâche manuelle utile).
   */
  function handleStartTour() {
    setWelcomeOpen(false)
    setChecklistShownLocally(true)
    setChecklistVersion((v) => v + 1)
    // Attendre que le DOM se stabilise avant de lancer driver.js
    setTimeout(() => runMerchantTour('loyalty_configured'), 300)
  }

  function handleSkip() {
    setWelcomeOpen(false)
    setChecklistShownLocally(true)
    setChecklistVersion((v) => v + 1)
  }

  /**
   * Quand l'utilisateur clique sur une tâche non-cochée et qu'elle n'a pas de
   * href (ou qu'on veut un tour contextuel), on lance le mini-tour correspondant.
   */
  function handleTriggerTour(taskId: MerchantOnboardingTaskId) {
    runMerchantTour(taskId)
  }

  /**
   * Callback de OnboardingChecklist : 100% atteint à l'instant.
   * On marque `onboarding_completed_at = now()` et on déclenche la célébration.
   */
  async function handleComplete() {
    if (completeMarkedRef.current) return
    completeMarkedRef.current = true

    try {
      await fetch('/api/business/onboarding/complete', { method: 'POST' })
    } catch {
      // Best-effort — la célébration se déclenche quand même.
    }
    setCelebrationOpen(true)
  }

  function handleCelebrationClose() {
    setCelebrationOpen(false)
    // Une fois la célébration fermée, on masque la checklist localement —
    // au prochain render serveur, `onboarding_completed_at NOT NULL` la masquera
    // de toute façon, mais on évite un flash entre le close et le reload.
    setChecklistShownLocally(false)
  }

  if (!checklistShownLocally && !welcomeOpen) return null

  const checklist = checklistShownLocally ? (
    <OnboardingChecklist
      version={checklistVersion}
      onTriggerTour={handleTriggerTour}
      onComplete={handleComplete}
    />
  ) : null

  return (
    <>
      {welcomeOpen && (
        <OnboardingWelcomeModal
          firstName={firstName}
          open
          onStartTour={handleStartTour}
          onSkip={handleSkip}
        />
      )}

      {/* Si le slot sidebar existe (desktop), on portal la checklist dedans.
          Sinon (SSR initial / mobile) on rend inline en bas du layout. */}
      {checklist && slotEl
        ? createPortal(checklist, slotEl)
        : checklist && (
            <div className="fixed bottom-20 left-4 right-4 md:hidden z-30">
              {checklist}
            </div>
          )}

      {celebrationOpen && (
        <OnboardingCompleteModal firstName={firstName} onClose={handleCelebrationClose} />
      )}
    </>
  )
}
