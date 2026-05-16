'use client'

/**
 * Story 9.2 v2 — Orchestrateur Coachmark côté client.
 *
 * Mounted dans CardPageClient. Coordonne les flows interactifs déclenchés
 * depuis la checklist du banner (Wallet, Customize). Réutilise Coachmark.tsx
 * du merchant — composant générique compatible mobile.
 *
 * Comportement :
 *  - Wallet (`wallet_added`) : 1-step coachmark sur le bouton Wallet du CardTab.
 *  - Customize (`card_customized`) : navigation vers /me/profile/card-customization
 *    + 2 steps (color picker → save).
 *  - PWA : géré séparément via PwaInstallPrompt en mode modal — pas de coachmark.
 *
 * Pattern : controlled — le parent passe `flowToStart` ; CustomerCoach se
 * synchronise et reset `flowToStart` à null via `onFlowEnded`.
 */

import { useState, useEffect, useCallback } from 'react'
import Coachmark from '@/components/dashboard/onboarding/Coachmark'
import {
  CUSTOMER_FLOWS,
  tryGetPendingCustomerFlow,
} from './customerOnboardingFlows'
import type { OnboardingTaskId } from '@/lib/onboarding/getCustomerTaskStatus'

interface CustomerCoachProps {
  /** TaskId du flow à démarrer (controlled). Reset à null par le parent
   *  une fois le flow consommé via `onFlowEnded`. */
  flowToStart: OnboardingTaskId | null
  /** Notifie le parent que le flow s'est terminé (close ou step final).
   *  Le parent doit reset `flowToStart` à null + refresh la checklist. */
  onFlowEnded: () => void
}

export default function CustomerCoach({ flowToStart, onFlowEnded }: CustomerCoachProps) {
  const [activeFlow, setActiveFlow] = useState<OnboardingTaskId | null>(null)
  const [stepIndex, setStepIndex] = useState(0)

  // Sync flowToStart → activeFlow (controlled).
  useEffect(() => {
    if (flowToStart && flowToStart !== activeFlow) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- controlled sync
      setActiveFlow(flowToStart)
       
      setStepIndex(0)
    }
  }, [flowToStart, activeFlow])

  // Pending flow après navigation : si le user vient d'arriver sur la page
  // cible suite à une navigation déclenchée par requestRunCustomerFlow, on
  // relance le flow inline.
  useEffect(() => {
    const pending = tryGetPendingCustomerFlow()
    if (pending) {
      const t = setTimeout(() => {
         
        setActiveFlow(pending)
         
        setStepIndex(0)
      }, 350)
      return () => clearTimeout(t)
    }
    return undefined
  }, [])

  const closeFlow = useCallback(() => {
    setActiveFlow(null)
    setStepIndex(0)
    onFlowEnded()
  }, [onFlowEnded])

  const advanceFlow = useCallback(() => {
    if (!activeFlow) return
    const flow = CUSTOMER_FLOWS[activeFlow]
    if (!flow) {
      closeFlow()
      return
    }
    setStepIndex((idx) => {
      if (idx + 1 >= flow.steps.length) {
        // Step final → close + signal au parent
        setActiveFlow(null)
        onFlowEnded()
        return 0
      }
      return idx + 1
    })
  }, [activeFlow, closeFlow, onFlowEnded])

  const prevStep = useCallback(() => {
    setStepIndex((idx) => Math.max(0, idx - 1))
  }, [])

  const flow = activeFlow ? CUSTOMER_FLOWS[activeFlow] : null
  const currentStep = flow ? flow.steps[stepIndex] : null
  const totalSteps = flow?.steps.length ?? 0

  if (!currentStep || !flow) return null

  return (
    <Coachmark
      key={`${activeFlow}-${stepIndex}`}
      step={currentStep}
      current={stepIndex + 1}
      total={totalSteps}
      onAdvance={advanceFlow}
      onClose={closeFlow}
      onPrev={stepIndex > 0 ? prevStep : undefined}
    />
  )
}
