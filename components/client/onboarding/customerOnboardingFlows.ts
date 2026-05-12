/**
 * Walkthroughs interactifs côté client.
 *
 * Symétrique au merchant onboardingFlows.ts mais adapté au scope client :
 *  - PWA install : la bonne UX est la modal (PwaInstallPrompt en mode="modal"),
 *    pas un coachmark — donc PAS de flow ici, le banner click ouvre directement
 *    la modal.
 *  - Wallet : 1 step coachmark sur le bouton "Ajouter à Apple Wallet" du CardTab.
 *
 * (2026-05-11) Flow `card_customized` retiré : la personnalisation client a
 * été supprimée du scope pilote (la carte affiche désormais la charte merchant).
 */

import { CreditCard02 } from '@untitledui/icons'
import type { CoachmarkStep } from '@/components/dashboard/onboarding/Coachmark'
import type { OnboardingTaskId } from '@/lib/onboarding/getCustomerTaskStatus'

export interface CustomerFlow {
  /** URL de la page sur laquelle le flow s'exécute. Si différente de la page courante,
   *  on navigue d'abord puis on relance au montage. */
  path: string
  steps: CoachmarkStep[]
}

const SESSION_KEY = 'izou:customer:pendingFlow'

/**
 * Définition des flows interactifs côté client.
 *
 * Sélecteurs `[data-tour=...]` à maintenir en cohérence avec :
 *  - wallet-add  → app/card/[cardId]/components/CardTab.tsx
 */
export const CUSTOMER_FLOWS: Partial<Record<OnboardingTaskId, CustomerFlow>> = {
  wallet_added: {
    // Le bouton Wallet est sur la card page (CardTab). On laisse `path: ''`
    // pour signifier "n'importe quelle card page" — la navigation est gérée
    // par le caller (qui a déjà le cardId).
    path: '',
    steps: [
      {
        id: 'wallet-add',
        targetSelector: '[data-tour="wallet-add"]',
        icon: CreditCard02,
        title: 'Ajoutez votre carte au Wallet',
        description: 'Cliquez ici pour télécharger le pass et l\'ajouter.',
        advanceOn: 'click',
      },
    ],
  },
}

/**
 * Demande à exécuter un flow customer.
 * - Si flow inexistant → null.
 * - Si déjà sur la bonne page (ou path === '') → retourne le flow inline.
 * - Sinon → stocke + navigue, le flow sera relancé au montage suivant via
 *   `tryGetPendingCustomerFlow()`.
 */
export function requestRunCustomerFlow(taskId: OnboardingTaskId): CustomerFlow | null {
  if (typeof window === 'undefined') return null
  const flow = CUSTOMER_FLOWS[taskId]
  if (!flow) return null

  // path === '' = "n'importe quelle page" (ex: wallet sur la card page courante)
  if (flow.path && window.location.pathname !== flow.path) {
    try {
      sessionStorage.setItem(SESSION_KEY, taskId)
    } catch {
      // sessionStorage indisponible — flow lance avec popover en bas-droite
    }
    window.location.assign(flow.path)
    return null
  }

  return flow
}

/**
 * À appeler au montage. Si un flow était en attente, retourne son taskId
 * et nettoie sessionStorage.
 */
export function tryGetPendingCustomerFlow(): OnboardingTaskId | null {
  if (typeof window === 'undefined') return null
  let pending: string | null = null
  try {
    pending = sessionStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
  if (!pending) return null
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
  if (!(pending in CUSTOMER_FLOWS)) return null
  return pending as OnboardingTaskId
}
