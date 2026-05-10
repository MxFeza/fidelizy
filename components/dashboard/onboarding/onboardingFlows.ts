/**
 * Story 9.1.fix v2 — Walkthroughs interactifs multi-step.
 *
 * Chaque flow décompose une tâche d'onboarding en 1-N steps qui pointent
 * SUCCESSIVEMENT chaque bouton/champ que l'utilisateur doit toucher.
 * Les steps avancent automatiquement quand l'action attendue est détectée
 * sur la cible (clic d'un bouton, change d'un input).
 *
 * Pattern :
 *   1. requestRunFlow(taskId) appelé depuis la checklist sidebar.
 *   2. Si la page cible !== page actuelle → sessionStorage + navigate, false retourné.
 *   3. Au montage de OnboardingCoach sur la nouvelle page,
 *      tryGetPendingFlowOnMount() relit sessionStorage, retourne le taskId.
 *   4. Le Coachmark joue les steps un par un, avance auto sur action user.
 */

import {
  Settings01,
  Image01,
  Gift01,
  Star01,
  CheckDone01,
  QrCode01,
  Download01,
  UserPlus01,
  Bell01,
  Send01,
  Lightbulb02,
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
 * Définition des flows interactifs.
 *
 * Sélecteurs `[data-tour=...]` à maintenir en cohérence avec les pages cibles :
 *   - business-info, logo-upload     dans settings/BusinessClient.tsx
 *   - loyalty-type, loyalty-add-tier dans marketing/loyalty/LoyaltyClient.tsx
 *   - loyalty-save                   idem
 *   - qr-pdf, qr-confirm-printed     dans DashboardClient.tsx
 *   - invite-cta                     dans clients/ClientsClient.tsx
 *   - push-create, push-templates    dans marketing/push/PushClient.tsx
 *   - push-config, push-send         idem
 */
export const MERCHANT_FLOWS: Partial<Record<MerchantOnboardingTaskId, MerchantFlow>> = {
  // Profil : 1 step sur la zone Nom + Adresse (les 2 inputs ensemble),
  // suivant manuel pour laisser à l'utilisateur le temps de saisir.
  profile_complete: {
    path: '/dashboard/settings',
    steps: [
      {
        id: 'profile-info',
        targetSelector: '[data-tour="business-info"]',
        icon: Settings01,
        title: 'Renseignez votre commerce',
        description: 'Le nom et l\'adresse — vos clients verront ces infos.',
        advanceOn: 'manual',
      },
    ],
  },

  // Logo : 1 step sur la zone d'upload, manuel (l'upload prend du temps).
  logo_uploaded: {
    path: '/dashboard/settings',
    steps: [
      {
        id: 'logo-upload',
        targetSelector: '[data-tour="logo-upload"]',
        icon: Image01,
        title: 'Ajoutez votre logo',
        description: 'Il apparaîtra sur les cartes de fidélité.',
        advanceOn: 'manual',
      },
    ],
  },

  // Programme fidélité : 4 steps. Auparavant 3 mais le user n'avait pas le
  // temps de remplir le palier après avoir cliqué Ajouter (advance auto trop
  // rapide → palier vide sans nom/emoji/seuil). On split en 2 : clic sur
  // Ajouter (auto), puis pause manual pour remplir le palier, puis clic Save.
  loyalty_configured: {
    path: '/dashboard/marketing/loyalty',
    steps: [
      {
        id: 'loyalty-type',
        targetSelector: '[data-tour="loyalty-type"]',
        icon: Gift01,
        title: 'Choisissez votre système',
        description: 'Tampons (visite = tampon) ou points (€ = point).',
        advanceOn: 'click',
      },
      {
        id: 'loyalty-add-tier',
        targetSelector: '[data-tour="loyalty-add-tier"]',
        icon: Star01,
        title: 'Ajoutez votre 1er palier',
        description: 'Cliquez ici pour créer un palier vide à remplir.',
        advanceOn: 'click',
      },
      {
        id: 'loyalty-tier-edit',
        targetSelector: '[data-tour="loyalty-tiers"]',
        icon: Star01,
        title: 'Personnalisez votre palier',
        description: 'Choisissez emoji, nom et seuil. Cliquez Suivant quand prêt.',
        advanceOn: 'manual',
      },
      {
        id: 'loyalty-save',
        targetSelector: '[data-tour="loyalty-save"]',
        icon: CheckDone01,
        title: 'Enregistrez votre programme',
        description: 'Validez ici pour activer votre programme de fidélité.',
        advanceOn: 'click',
      },
    ],
  },

  // QR code : 2 steps — télécharger le PDF, puis cocher la tâche.
  qr_printed: {
    path: '/dashboard',
    steps: [
      {
        id: 'qr-pdf',
        targetSelector: '[data-tour="qr-pdf"]',
        icon: Download01,
        title: 'Téléchargez votre QR',
        description: 'Imprimez-le et posez-le près de la caisse.',
        advanceOn: 'click',
      },
      {
        id: 'qr-confirm',
        targetSelector: '[data-tour="qr-confirm-printed"]',
        icon: QrCode01,
        title: 'Confirmez l\'impression',
        description: 'Cliquez ici une fois votre QR posé en boutique.',
        advanceOn: 'click',
      },
    ],
  },

  // Premier client : 1 step sur le CTA Scanner.
  first_client: {
    path: '/dashboard/clients',
    steps: [
      {
        id: 'first-client',
        targetSelector: '[data-tour="invite-cta"]',
        icon: UserPlus01,
        title: 'Invitez votre premier client',
        description: 'Scannez un client présent ou partagez votre QR.',
        advanceOn: 'manual',
      },
    ],
  },

  // Notifications push : 4 steps qui guident la création complète.
  notif_setup: {
    path: '/dashboard/marketing/push',
    steps: [
      {
        id: 'push-create',
        targetSelector: '[data-tour="push-create"]',
        icon: Bell01,
        title: 'Créez votre première notification',
        description: 'Cliquez ici pour ouvrir le formulaire.',
        advanceOn: 'click',
      },
      {
        id: 'push-templates',
        targetSelector: '[data-tour="push-templates"]',
        icon: Lightbulb02,
        title: 'Choisissez un modèle',
        description: 'Ces formulations marchent bien — cliquez-en une.',
        advanceOn: 'click',
      },
      {
        id: 'push-config',
        targetSelector: '[data-tour="push-config"]',
        icon: Settings01,
        title: 'Personnalisez votre message',
        description: 'Ajustez le titre et le corps puis cliquez Suivant.',
        advanceOn: 'manual',
      },
      {
        id: 'push-send',
        targetSelector: '[data-tour="push-send"]',
        icon: Send01,
        title: 'Envoyez la campagne',
        description: 'Quand vous êtes prêt, cliquez ici pour envoyer.',
        // advanceOn 'click' : le coachmark se ferme automatiquement quand
        // l'utilisateur clique Envoyer (la modal de confirmation app prend
        // alors le relais sans stacker avec un coachmark résiduel).
        advanceOn: 'click',
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
      // sans navigation ; le user verra un popover en bas-droite.
    }
    window.location.assign(flow.path)
    return null
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
