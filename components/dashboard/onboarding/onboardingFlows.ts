/**
 * Story 9.1.fix — Définition des flows interactifs (remplace driver.js).
 *
 * Chaque flow = 1 à N coachmark steps. Steps avancent automatiquement quand
 * l'utilisateur fait l'action attendue (clic sur radio, submit, etc.) plutôt
 * que via un bouton "Suivant" — c'est ce qui rend le tour vraiment interactif
 * (cf. feedback user 2026-05-10 sur Story 9.1).
 *
 * Pattern :
 *   1. requestRunFlow(taskId) appelé depuis la checklist sidebar.
 *   2. Si la page cible !== page actuelle → sessionStorage + navigate, false retourné.
 *   3. Au montage de OnboardingCoach sur la nouvelle page,
 *      tryGetPendingFlowOnMount() relit sessionStorage, retourne le taskId,
 *      et OnboardingCoach lance le flow inline.
 *   4. Le Coachmark écoute l'event sur la cible et avance auto le step.
 */

import {
  Settings01,
  Image01,
  Gift01,
  Star01,
  QrCode01,
  UserPlus01,
  Bell01,
} from '@untitledui/icons'

import type { CoachmarkStep } from './Coachmark'
import type { MerchantOnboardingTaskId } from '@/lib/onboarding/getMerchantTaskStatus'

export interface MerchantFlow {
  /** URL de la page sur laquelle le flow s'exécute. Si différente de la page courante,
   *  on navigue d'abord puis on relance au montage. */
  path: string
  steps: CoachmarkStep[]
}

const SESSION_KEY = 'izou:onboarding:pendingFlow'

/**
 * Définition des 5 flows interactifs (les 2 tâches "first_client" et
 * "first_reward_claimed" se cochent par actions naturelles, pas de tour).
 *
 * Les sélecteurs `[data-tour=...]` doivent être ajoutés sur les pages cibles.
 */
export const MERCHANT_FLOWS: Partial<Record<MerchantOnboardingTaskId, MerchantFlow>> = {
  profile_complete: {
    path: '/dashboard/settings',
    steps: [
      {
        id: 'profile-info',
        targetSelector: '[data-tour="business-info"]',
        icon: Settings01,
        title: 'Renseignez votre commerce',
        description: 'Nom et adresse — vos clients verront ces infos.',
        advanceOn: 'manual',
      },
    ],
  },

  logo_uploaded: {
    path: '/dashboard/settings',
    steps: [
      {
        id: 'logo-upload',
        targetSelector: '[data-tour="logo-upload"]',
        icon: Image01,
        title: 'Ajoutez votre logo',
        description: 'Il apparaîtra sur les cartes de fidélité de vos clients.',
        advanceOn: 'manual',
      },
    ],
  },

  loyalty_configured: {
    path: '/dashboard/marketing/loyalty',
    steps: [
      {
        id: 'loyalty-type',
        targetSelector: '[data-tour="loyalty-type"]',
        icon: Gift01,
        title: 'Tampons ou points ?',
        description: 'Choisissez le système qui correspond à votre commerce.',
        advanceOn: 'click',
      },
      {
        id: 'loyalty-tiers',
        targetSelector: '[data-tour="loyalty-tiers"]',
        icon: Star01,
        title: 'Définissez les récompenses',
        description: 'Ajoutez 2-4 paliers pour donner envie de revenir.',
        advanceOn: 'manual',
      },
    ],
  },

  qr_printed: {
    path: '/dashboard',
    steps: [
      {
        id: 'qr-section',
        targetSelector: '[data-tour="qr-section"]',
        icon: QrCode01,
        title: 'Téléchargez votre QR',
        description: 'Imprimez-le et posez-le près de la caisse.',
        advanceOn: 'manual',
      },
    ],
  },

  first_client: {
    path: '/dashboard/clients',
    steps: [
      {
        id: 'first-client',
        targetSelector: '[data-tour="invite-cta"]',
        icon: UserPlus01,
        title: 'Invitez votre premier client',
        description: 'Partagez votre QR ou créez une carte manuellement.',
        advanceOn: 'manual',
      },
    ],
  },

  notif_setup: {
    path: '/dashboard/marketing/push',
    steps: [
      {
        id: 'push-config',
        targetSelector: '[data-tour="push-config"]',
        icon: Bell01,
        title: 'Activez les notifications',
        description: 'Relancez vos clients endormis en quelques clics.',
        advanceOn: 'manual',
      },
    ],
  },
}

/**
 * Demande à exécuter un flow.
 * - Si le flow n'existe pas pour ce taskId → retourne `null` (no-op).
 * - Si on est sur la bonne page → retourne le flow ; le caller le lance inline.
 * - Si on est sur la mauvaise page → on stocke le taskId et on navigue ;
 *   le flow sera relancé au montage suivant via `tryGetPendingFlowOnMount`.
 */
export function requestRunFlow(taskId: MerchantOnboardingTaskId): MerchantFlow | null {
  if (typeof window === 'undefined') return null
  const flow = MERCHANT_FLOWS[taskId]
  if (!flow) return null

  if (window.location.pathname !== flow.path) {
    try {
      sessionStorage.setItem(SESSION_KEY, taskId)
    } catch {
      // sessionStorage indisponible (mode privé) → on lance quand même un flow
      // centré sans navigation ; le user verra un popover sans highlight.
    }
    window.location.assign(flow.path)
    return null // navigation en cours, le caller ne doit pas démarrer le flow ici
  }

  return flow
}

/**
 * À appeler au montage de OnboardingCoach. Si un flow était en attente
 * (suite à navigation), retourne son taskId et nettoie sessionStorage.
 */
export function tryGetPendingFlowOnMount(): MerchantOnboardingTaskId | null {
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
  if (!(pending in MERCHANT_FLOWS)) return null
  return pending as MerchantOnboardingTaskId
}
