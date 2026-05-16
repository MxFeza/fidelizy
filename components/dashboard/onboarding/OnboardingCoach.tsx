'use client'

/**
 * Story 9.1 — Orchestrateur d'activation coach commerçant.
 *
 * Mounted dans `app/dashboard/(protected)/layout.tsx`. Coordonne :
 *   1. Modal Welcome 1ᵉʳ login (OnboardingWelcomeModal)
 *   2. Widget checklist persistant en sidebar (OnboardingChecklist)
 *   3. Coachmarks interactifs Untitled UI (Coachmark + onboardingFlows)
 *   4. Célébration 100% (Confetti + modal félicitations)
 *
 * Story 9.1.fix (2026-05-10) : driver.js remplacé par Coachmark custom Untitled UI
 * (popovers compacts qui s'avancent auto sur action utilisateur — pas via "Suivant").
 *
 * Au montage : fetch /api/business/onboarding/status pour décider quoi afficher.
 * Le widget checklist est rendu via portal/teleport dans la sidebar.
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import OnboardingWelcomeModal from './OnboardingWelcomeModal'
import OnboardingChecklist from './OnboardingChecklist'
import OnboardingCompleteModal from './OnboardingCompleteModal'
import Coachmark from './Coachmark'
import {
  MERCHANT_FLOWS,
  requestRunFlow,
  tryGetPendingFlowOnMount,
} from './onboardingFlows'
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
  // doit s'afficher même si la prop initiale était false.
  const [checklistShownLocally, setChecklistShownLocally] = useState(showChecklist)
  const [checklistVersion, setChecklistVersion] = useState(0)
  const [celebrationOpen, setCelebrationOpen] = useState(false)
  const [slotEl, setSlotEl] = useState<Element | null>(null)
  const completeMarkedRef = useRef(false)

  // --- Coachmark state ---
  const [activeFlow, setActiveFlow] = useState<MerchantOnboardingTaskId | null>(null)
  const [activeStepIndex, setActiveStepIndex] = useState(0)

  const closeCoachmark = useCallback(() => {
    setActiveFlow(null)
    setActiveStepIndex(0)
  }, [])

  const advanceCoachmark = useCallback(() => {
    if (!activeFlow) return
    const flow = MERCHANT_FLOWS[activeFlow]
    if (!flow) {
      closeCoachmark()
      return
    }
    setActiveStepIndex((idx) => {
      if (idx + 1 >= flow.steps.length) {
        // Step final atteint → on ferme et on demande un refresh status
        // (l'utilisateur vient potentiellement de faire l'action ; le check
        //  serveur va peut-être marquer la tâche comme done).
        setActiveFlow(null)
        setChecklistVersion((v) => v + 1)
        return 0
      }
      return idx + 1
    })
  }, [activeFlow, closeCoachmark])

  const prevCoachmark = useCallback(() => {
    setActiveStepIndex((idx) => Math.max(0, idx - 1))
  }, [])

  // Cherche le slot sidebar après mount (DOM-dependent).
  // Relance un flow différé si l'utilisateur vient d'être navigué.
  useEffect(() => {
    const el = document.querySelector('[data-onboarding-slot]')
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional DOM->state sync after layout
    setSlotEl(el)

    // Pending flow après navigation : si un taskId est en sessionStorage,
    // on lance le flow inline. Petit délai pour laisser le DOM se stabiliser.
    const pending = tryGetPendingFlowOnMount()
    if (pending) {
      const t = setTimeout(() => {
        // setState dans un setTimeout, hors de l'effect body — pas concerné
        // par la règle set-state-in-effect, mais on garde l'éligibilité.
        setActiveFlow(pending)
        setActiveStepIndex(0)
      }, 350)
      return () => clearTimeout(t)
    }
    return undefined
  }, [])

  /**
   * Au clic sur "Commencer la visite" du modal welcome, on lance le flow
   * principal sur Marketing > Fidélité (= 1ʳᵉ tâche manuelle utile).
   */
  function handleStartTour() {
    setWelcomeOpen(false)
    setChecklistShownLocally(true)
    setChecklistVersion((v) => v + 1)

    // Lance le flow loyalty_configured (navigation si pas sur la bonne page,
    // sinon flow inline immédiat).
    const flow = requestRunFlow('loyalty_configured')
    if (flow) {
      setTimeout(() => {
        setActiveFlow('loyalty_configured')
        setActiveStepIndex(0)
      }, 300)
    }
    // Sinon navigation déclenchée : tryGetPendingFlowOnMount le relancera.
  }

  function handleSkip() {
    setWelcomeOpen(false)
    setChecklistShownLocally(true)
    setChecklistVersion((v) => v + 1)
  }

  /**
   * Quand l'utilisateur clique sur une tâche non-cochée et qu'elle a un
   * flow associé, on lance le coachmark correspondant.
   */
  function handleTriggerTour(taskId: MerchantOnboardingTaskId) {
    const flow = requestRunFlow(taskId)
    if (flow) {
      setActiveFlow(taskId)
      setActiveStepIndex(0)
    }
    // Sinon navigation en cours.
  }

  /**
   * Callback de OnboardingChecklist : 100% atteint à l'instant.
   */
  async function handleComplete() {
    if (completeMarkedRef.current) return
    completeMarkedRef.current = true

    try {
      await fetch('/api/business/onboarding/complete', { method: 'POST' })
    } catch {
      // Best-effort
    }
    setCelebrationOpen(true)
  }

  function handleCelebrationClose() {
    setCelebrationOpen(false)
    setChecklistShownLocally(false)
  }

  // ---- Render decisions ----
  const flowDef = activeFlow ? MERCHANT_FLOWS[activeFlow] : null
  const currentStep = flowDef ? flowDef.steps[activeStepIndex] : null
  const totalSteps = flowDef?.steps.length ?? 0

  if (!checklistShownLocally && !welcomeOpen && !currentStep) return null

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

      {/* Sidebar checklist : portal vers slot desktop, sinon inline mobile. */}
      {checklist && slotEl
        ? createPortal(checklist, slotEl)
        : checklist && (
            <div className="fixed bottom-20 left-4 right-4 md:hidden z-30">
              {checklist}
            </div>
          )}

      {/* Coachmark interactif Untitled UI */}
      {currentStep && flowDef && (
        <Coachmark
          key={`${activeFlow}-${activeStepIndex}`}
          step={currentStep}
          current={activeStepIndex + 1}
          total={totalSteps}
          onAdvance={advanceCoachmark}
          onClose={closeCoachmark}
          onPrev={activeStepIndex > 0 ? prevCoachmark : undefined}
        />
      )}

      {celebrationOpen && (
        <OnboardingCompleteModal firstName={firstName} onClose={handleCelebrationClose} />
      )}
    </>
  )
}
