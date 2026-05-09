import { createServiceClient } from '@/lib/supabase/service'

export type MerchantOnboardingTaskId =
  | 'profile_complete'
  | 'logo_uploaded'
  | 'loyalty_configured'
  | 'qr_printed'
  | 'first_client'
  | 'notif_setup'
  | 'first_reward_claimed'

export interface MerchantOnboardingTask {
  id: MerchantOnboardingTaskId
  label: string
  /** Texte enthousiaste affiché à la complétion (toast / micro-célébration). */
  doneCelebration: string
  /** URL de destination quand on clique sur la tâche (ou trigger un mini-tour si null). */
  href: string | null
  done: boolean
}

export interface MerchantOnboardingStatus {
  started: boolean
  completed: boolean
  tasks: MerchantOnboardingTask[]
  /** Pourcentage complété 0-100 (basé sur les 7 tâches). */
  percent: number
  /** Nombre de tâches complétées. */
  doneCount: number
  /** Nombre total de tâches. */
  totalCount: number
}

const TASK_DEFS: Array<{
  id: MerchantOnboardingTaskId
  label: string
  doneCelebration: string
  href: string | null
}> = [
  {
    id: 'profile_complete',
    label: 'Compléter mon profil',
    doneCelebration: 'Premier pas franchi !',
    href: '/dashboard/settings',
  },
  {
    id: 'logo_uploaded',
    label: 'Ajouter mon logo',
    doneCelebration: "Votre commerce a déjà l'air pro.",
    href: '/dashboard/settings',
  },
  {
    id: 'loyalty_configured',
    label: 'Configurer mon programme de fidélité',
    doneCelebration: 'Vos clients vont adorer.',
    href: '/dashboard/marketing/loyalty',
  },
  {
    id: 'qr_printed',
    label: 'Imprimer mon QR code',
    doneCelebration: 'Boum, vous êtes opérationnel.',
    href: '/dashboard',
  },
  {
    id: 'first_client',
    label: 'Inviter mon premier client',
    doneCelebration: 'Un premier fidèle !',
    href: '/dashboard/clients',
  },
  {
    id: 'notif_setup',
    label: 'Activer les notifications push',
    doneCelebration: 'Vos clients reviendront plus souvent.',
    href: '/dashboard/marketing/push',
  },
  {
    id: 'first_reward_claimed',
    label: 'Voir un client réclamer sa récompense',
    doneCelebration: "Vous l'avez fidélisé. Bravo.",
    href: null,
  },
]

/**
 * Calcule l'état d'onboarding d'un commerçant (7 tâches).
 *
 * Tâches calculées en lecture pure côté serveur :
 *  1. profile_complete  → business_name && address NOT NULL
 *  2. logo_uploaded     → logo_url NOT NULL
 *  3. loyalty_configured→ loyalty_type NOT NULL ET (stamps_required > 0 OU reward_tiers non vide)
 *  4. qr_printed        → qr_printed_at NOT NULL (set par bouton "J'ai imprimé")
 *  5. first_client      → ≥1 loyalty_card pour ce business
 *  6. notif_setup       → notif_setup_at NOT NULL (set par /api/business/onboarding/notif-setup)
 *  7. first_reward_claimed → ≥1 reward_claims pour ce business OU
 *                            ≥1 claim_request status='validated' pour ce business
 *
 * Retourne `started` (modal welcome déjà cliqué) et `completed` (100%).
 */
export async function getMerchantTaskStatus(
  businessId: string,
): Promise<MerchantOnboardingStatus> {
  const service = createServiceClient()

  const { data: business } = await service
    .from('businesses')
    .select(
      'id, business_name, address, logo_url, loyalty_type, stamps_required, reward_tiers, onboarding_started_at, onboarding_completed_at, qr_printed_at, notif_setup_at',
    )
    .eq('id', businessId)
    .maybeSingle()

  // Cas dégradé : business introuvable → toutes les tâches à false.
  if (!business) {
    const tasks: MerchantOnboardingTask[] = TASK_DEFS.map((def) => ({
      ...def,
      done: false,
    }))
    return {
      started: false,
      completed: false,
      tasks,
      percent: 0,
      doneCount: 0,
      totalCount: tasks.length,
    }
  }

  // 1. Profile complete : business_name + address renseignés
  const profileComplete =
    !!business.business_name?.trim() && !!business.address?.trim()

  // 2. Logo uploaded
  const logoUploaded = !!business.logo_url

  // 3. Loyalty configured : loyalty_type set + au moins une condition de seuil
  const rewardTiers = Array.isArray(business.reward_tiers)
    ? business.reward_tiers
    : []
  const loyaltyConfigured =
    !!business.loyalty_type &&
    ((typeof business.stamps_required === 'number' && business.stamps_required > 0) ||
      rewardTiers.length > 0)

  // 4. QR imprimé (manuel via bouton checklist)
  const qrPrinted = business.qr_printed_at !== null

  // 5. First client : ≥1 carte de fidélité
  const { count: cardCount } = await service
    .from('loyalty_cards')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)

  const firstClient = (cardCount ?? 0) > 0

  // 6. Notifications push setup (manuel via setting)
  const notifSetup = business.notif_setup_at !== null

  // 7. Premier reward réclamé : reward_claims OU claim_requests validated
  let firstRewardClaimed = false

  // Tente d'abord reward_claims joint à loyalty_cards (business_id présent côté card)
  const { data: claimsData } = await service
    .from('reward_claims')
    .select('id, loyalty_cards!inner(business_id)')
    .eq('loyalty_cards.business_id', businessId)
    .limit(1)

  if (claimsData && claimsData.length > 0) {
    firstRewardClaimed = true
  } else {
    // Fallback : claim_requests validated. Le schéma peut exposer business_id directement.
    const { count: claimReqCount } = await service
      .from('claim_requests')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'validated')

    firstRewardClaimed = (claimReqCount ?? 0) > 0
  }

  const doneByTask: Record<MerchantOnboardingTaskId, boolean> = {
    profile_complete: profileComplete,
    logo_uploaded: logoUploaded,
    loyalty_configured: loyaltyConfigured,
    qr_printed: qrPrinted,
    first_client: firstClient,
    notif_setup: notifSetup,
    first_reward_claimed: firstRewardClaimed,
  }

  const tasks: MerchantOnboardingTask[] = TASK_DEFS.map((def) => ({
    ...def,
    done: doneByTask[def.id],
  }))

  const doneCount = tasks.filter((t) => t.done).length
  const percent = Math.round((doneCount / tasks.length) * 100)

  return {
    started: business.onboarding_started_at !== null,
    completed: business.onboarding_completed_at !== null,
    tasks,
    percent,
    doneCount,
    totalCount: tasks.length,
  }
}
