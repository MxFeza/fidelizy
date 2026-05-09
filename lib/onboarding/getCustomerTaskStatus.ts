import { createServiceClient } from '@/lib/supabase/service'

export type OnboardingTaskId = 'card_created' | 'pwa_installed' | 'wallet_added'

export interface OnboardingTask {
  id: OnboardingTaskId
  label: string
  done: boolean
}

export interface OnboardingStatus {
  started: boolean
  completed: boolean
  tasks: OnboardingTask[]
  /** Pourcentage complété 0-100 (basé sur les 3 tâches) */
  percent: number
}

const TASK_LABELS: Record<OnboardingTaskId, string> = {
  card_created: 'Carte créée',
  pwa_installed: "Installer l'app sur mon tel",
  wallet_added: 'Ajouter au Apple Wallet',
}

/**
 * Calcule l'état d'onboarding d'un client (3 tâches).
 *
 * - `card_created` : auto vrai dès qu'au moins une loyalty_card existe.
 * - `pwa_installed` : vrai si `customers.pwa_installed_at IS NOT NULL`.
 * - `wallet_added` : vrai si `customers.wallet_added_at IS NOT NULL`
 *   OU s'il y a une ligne dans `wallet_registrations` pour ce client.
 */
export async function getCustomerTaskStatus(customerId: string): Promise<OnboardingStatus> {
  const service = createServiceClient()

  const { data: customer } = await service
    .from('customers')
    .select('onboarding_started_at, onboarding_completed_at, pwa_installed_at, wallet_added_at')
    .eq('id', customerId)
    .maybeSingle()

  if (!customer) {
    return {
      started: false,
      completed: false,
      tasks: [
        { id: 'card_created', label: TASK_LABELS.card_created, done: false },
        { id: 'pwa_installed', label: TASK_LABELS.pwa_installed, done: false },
        { id: 'wallet_added', label: TASK_LABELS.wallet_added, done: false },
      ],
      percent: 0,
    }
  }

  // 1) carte créée si au moins une loyalty_card
  const { count: cardCount } = await service
    .from('loyalty_cards')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId)

  const cardCreated = (cardCount ?? 0) > 0

  // 2) PWA installée
  const pwaInstalled = customer.pwa_installed_at !== null

  // 3) Wallet ajouté — soit timestamp, soit ligne dans wallet_registrations.
  // wallet_registrations.serial_number = qr_code_id de la carte. On rejoint via loyalty_cards.
  let walletAdded = customer.wallet_added_at !== null

  if (!walletAdded) {
    const { data: cards } = await service
      .from('loyalty_cards')
      .select('qr_code_id')
      .eq('customer_id', customerId)

    const serials = (cards ?? []).map((c) => c.qr_code_id)
    if (serials.length > 0) {
      const { count: regCount } = await service
        .from('wallet_registrations')
        .select('serial_number', { count: 'exact', head: true })
        .in('serial_number', serials)
      walletAdded = (regCount ?? 0) > 0
    }
  }

  const tasks: OnboardingTask[] = [
    { id: 'card_created', label: TASK_LABELS.card_created, done: cardCreated },
    { id: 'pwa_installed', label: TASK_LABELS.pwa_installed, done: pwaInstalled },
    { id: 'wallet_added', label: TASK_LABELS.wallet_added, done: walletAdded },
  ]

  const doneCount = tasks.filter((t) => t.done).length
  const percent = Math.round((doneCount / tasks.length) * 100)

  return {
    started: customer.onboarding_started_at !== null,
    completed: customer.onboarding_completed_at !== null,
    tasks,
    percent,
  }
}
