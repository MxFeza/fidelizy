import { createServiceClient } from '@/lib/supabase/service'

export type OnboardingTaskId =
  | 'card_created'
  | 'pwa_installed'
  | 'wallet_added'
  | 'card_customized'

export interface OnboardingTask {
  id: OnboardingTaskId
  label: string
  done: boolean
}

export interface OnboardingStatus {
  started: boolean
  completed: boolean
  tasks: OnboardingTask[]
  /** Pourcentage complété 0-100 (basé sur les tâches). */
  percent: number
}

const TASK_LABELS: Record<OnboardingTaskId, string> = {
  card_created: 'Carte créée',
  pwa_installed: "Installer l'app sur mon tel",
  wallet_added: 'Ajouter au Apple Wallet',
  card_customized: 'Personnaliser ma carte',
}

const TASK_ORDER: OnboardingTaskId[] = [
  'card_created',
  'pwa_installed',
  'wallet_added',
  'card_customized',
]

function emptyTasks(): OnboardingTask[] {
  return TASK_ORDER.map((id) => ({ id, label: TASK_LABELS[id], done: false }))
}

/**
 * Calcule l'état d'onboarding d'un client (4 tâches depuis Story 9.2 v2).
 *
 * - `card_created`     : auto, dès qu'au moins une loyalty_card existe.
 * - `pwa_installed`    : `customers.pwa_installed_at IS NOT NULL`.
 * - `wallet_added`     : `customers.wallet_added_at IS NOT NULL` OU
 *                         ligne dans `wallet_registrations` pour ce client.
 * - `card_customized`  : `customers.card_color IS NOT NULL` (couleur choisie
 *                         depuis /me/profile/card-customization).
 */
export async function getCustomerTaskStatus(customerId: string): Promise<OnboardingStatus> {
  const service = createServiceClient()

  const { data: customer } = await service
    .from('customers')
    .select(
      'onboarding_started_at, onboarding_completed_at, pwa_installed_at, wallet_added_at, card_color',
    )
    .eq('id', customerId)
    .maybeSingle()

  if (!customer) {
    return {
      started: false,
      completed: false,
      tasks: emptyTasks(),
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

  // 4) Carte personnalisée — couleur choisie
  const cardCustomized = customer.card_color !== null && customer.card_color !== undefined

  const doneByTask: Record<OnboardingTaskId, boolean> = {
    card_created: cardCreated,
    pwa_installed: pwaInstalled,
    wallet_added: walletAdded,
    card_customized: cardCustomized,
  }

  const tasks: OnboardingTask[] = TASK_ORDER.map((id) => ({
    id,
    label: TASK_LABELS[id],
    done: doneByTask[id],
  }))

  const doneCount = tasks.filter((t) => t.done).length
  const percent = Math.round((doneCount / tasks.length) * 100)

  return {
    started: customer.onboarding_started_at !== null,
    completed: customer.onboarding_completed_at !== null,
    tasks,
    percent,
  }
}
