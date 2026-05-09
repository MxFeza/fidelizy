/**
 * Story 9.1 — Mini-tours driver.js contextuels par tâche d'onboarding commerçant.
 *
 * Chaque tâche peut avoir un mini-tour 1-3 popovers. Si la tâche n'a pas
 * de tour défini, on tente une navigation simple (gérée côté `TaskItem`
 * via `href`).
 *
 * Comportement :
 *   - Le tour "loyalty_configured" est lancé automatiquement quand l'utilisateur
 *     clique "Commencer la visite" du modal Welcome (=premier login).
 *   - Les autres tours sont lancés au clic sur la tâche correspondante de la
 *     checklist.
 *
 * Selectors :
 *   - Préférence pour `[data-tour=...]` ajoutés progressivement aux composants
 *     existants (sidebar/loyalty page) — ainsi pas de couplage fragile au markup.
 *   - Fallback: pas de selector (popover centré) quand l'élément n'est pas
 *     visible sur la page courante (ex: tour "logo" en étant sur le dashboard).
 *
 * driver.js MIT, ~5 KB. Doc : https://driverjs.com/docs/getting-started
 */

import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'

import type { MerchantOnboardingTaskId } from '@/lib/onboarding/getMerchantTaskStatus'

type TourDef = {
  /** Steps driver.js. Si `element` est omis, le popover est centré écran. */
  steps: DriveStep[]
  /**
   * URL de navigation à effectuer AVANT de lancer le tour. Si la page courante
   * matche déjà, on ne navigue pas (driver.js démarre directement).
   */
  navigateTo?: string
}

/**
 * Définitions des tours par tâche. Pas tous les ids ne sont câblés — les tâches
 * trivialement complétables par action utilisateur (`first_client`,
 * `first_reward_claimed`) n'ont pas de tour, juste un popover narratif.
 */
const TOURS: Partial<Record<MerchantOnboardingTaskId, TourDef>> = {
  // Tâche 1 — Compléter mon profil : guide vers Mon entreprise + champs clés.
  profile_complete: {
    navigateTo: '/dashboard/settings',
    steps: [
      {
        popover: {
          title: '🪪 Votre vitrine commence ici',
          description:
            "Renseignez le nom de votre commerce et son adresse. Vos clients verront ces infos dans l'app — donnez-leur envie.",
          showButtons: ['next', 'close'],
        },
      },
    ],
  },

  // Tâche 2 — Ajouter mon logo.
  logo_uploaded: {
    navigateTo: '/dashboard/settings',
    steps: [
      {
        popover: {
          title: '🎨 Votre logo, votre signature',
          description:
            "Chargez le logo de votre commerce — il apparaîtra sur toutes les cartes de fidélité de vos clients. Un détail qui fait la différence.",
          showButtons: ['next', 'close'],
        },
      },
    ],
  },

  // Tâche 3 — Configurer mon programme de fidélité (tour principal lancé au
  // 1ᵉʳ login depuis le modal Welcome).
  loyalty_configured: {
    navigateTo: '/dashboard/marketing/loyalty',
    steps: [
      {
        popover: {
          title: '🎁 Tout commence ici',
          description:
            "Bienvenue dans le cœur de votre programme de fidélité. C'est ici que vous décidez comment récompenser vos clients fidèles.",
          showButtons: ['next', 'close'],
        },
      },
      {
        popover: {
          title: '☕️ Tampons ou points ?',
          description:
            "Tampons : parfait pour un café (ex : 10 visites = 1 boisson offerte). Points : idéal pour un commerce avec ticket variable (ex : 1 € = 1 point). Choisissez selon votre activité.",
          showButtons: ['previous', 'next', 'close'],
        },
      },
      {
        popover: {
          title: '🏆 Ajoutez des paliers',
          description:
            "Donnez envie à vos clients de revenir avec 2-4 paliers de récompense (ex : 5 visites → −10%, 10 visites → 1 offert). Vous pouvez tout modifier plus tard.",
          showButtons: ['previous', 'next', 'close'],
        },
      },
    ],
  },

  // Tâche 4 — Imprimer mon QR code (depuis le dashboard).
  qr_printed: {
    navigateTo: '/dashboard',
    steps: [
      {
        popover: {
          title: '📱 Votre QR code, votre vitrine en boutique',
          description:
            "Téléchargez le PDF, imprimez-le, posez-le près de la caisse. Vos premiers clients pourront s'inscrire en 5 secondes.",
          showButtons: ['next', 'close'],
        },
      },
      {
        popover: {
          title: '🖨️ Pensez à cocher la tâche',
          description:
            "Une fois imprimé, revenez dans la checklist et cliquez à nouveau sur la tâche pour confirmer.",
          showButtons: ['previous', 'next', 'close'],
        },
      },
    ],
  },

  // Tâche 6 — Activer les notifications push.
  notif_setup: {
    navigateTo: '/dashboard/marketing/push',
    steps: [
      {
        popover: {
          title: '🔔 Reconnectez vos clients endormis',
          description:
            "Avec les notifications push, vous pouvez relancer un client qui n'est pas venu depuis 30 jours. Une seule campagne peut faire revenir 10-20 % de votre base.",
          showButtons: ['next', 'close'],
        },
      },
    ],
  },
}

let activeTour: ReturnType<typeof driver> | null = null

/**
 * Lance le mini-tour associé à une tâche d'onboarding. Si aucun tour n'est
 * défini (ex: `first_client`), no-op silencieux.
 *
 * Si une navigation est nécessaire et qu'on n'est pas déjà sur la bonne page,
 * on redirige (window.location) puis on stocke l'id de tour dans sessionStorage
 * pour qu'il soit auto-lancé au montage de la page cible (cf. `tryRunPendingTour`).
 */
export function runMerchantTour(taskId: MerchantOnboardingTaskId): void {
  if (typeof window === 'undefined') return

  const tour = TOURS[taskId]
  if (!tour) return

  // Si une navigation est requise et qu'on n'est pas sur la bonne page :
  // on stocke et on redirige. Le tour sera relancé au montage suivant via
  // `tryRunPendingTour()`.
  if (tour.navigateTo && window.location.pathname !== tour.navigateTo) {
    try {
      sessionStorage.setItem('izou:onboarding:pendingTour', taskId)
    } catch {
      // sessionStorage indisponible (mode privé) → on lance quand même un popover
      // centré sans navigation. Acceptable.
    }
    window.location.assign(tour.navigateTo)
    return
  }

  startTour(tour)
}

/**
 * À appeler au montage du layout dashboard — relance un tour différé après
 * une navigation déclenchée par `runMerchantTour`.
 */
export function tryRunPendingTour(): void {
  if (typeof window === 'undefined') return
  let pending: string | null = null
  try {
    pending = sessionStorage.getItem('izou:onboarding:pendingTour')
  } catch {
    return
  }
  if (!pending) return
  try {
    sessionStorage.removeItem('izou:onboarding:pendingTour')
  } catch {
    // ignore
  }
  const tour = TOURS[pending as MerchantOnboardingTaskId]
  if (!tour) return
  // Petit délai pour laisser le DOM se stabiliser après navigation.
  setTimeout(() => startTour(tour), 400)
}

function startTour(tour: TourDef): void {
  // Termine un tour actif précédent (sécurité — driver.js gère mal
  // 2 instances en parallèle).
  if (activeTour) {
    try {
      activeTour.destroy()
    } catch {
      // ignore
    }
    activeTour = null
  }

  activeTour = driver({
    showProgress: tour.steps.length > 1,
    allowClose: true,
    overlayOpacity: 0.6,
    stagePadding: 8,
    smoothScroll: true,
    nextBtnText: 'Suivant',
    prevBtnText: 'Précédent',
    doneBtnText: 'Terminer',
    progressText: '{{current}} / {{total}}',
    steps: tour.steps,
    onDestroyed: () => {
      activeTour = null
    },
  })

  activeTour.drive()
}
