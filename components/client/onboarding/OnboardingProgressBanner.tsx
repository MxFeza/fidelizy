'use client'

/**
 * Banner persistant en haut de la home /card/[cardId] qui suit la progression
 * de l'onboarding client (3 taches : carte cree / install PWA / Wallet).
 *
 * Visibilite : md:hidden (mobile uniquement, cf. critere d'acceptation §11.7).
 *
 * Disparait quand 3/3 taches faites (parent appelle POST /api/me/onboarding/complete
 * et masque le banner).
 *
 * Story 9.2 §5.
 */

import { CheckCircle, ArrowRight, Lightning01 } from '@untitledui/icons'
import type { OnboardingStatus, OnboardingTaskId } from '@/lib/onboarding/getCustomerTaskStatus'

interface Props {
  status: OnboardingStatus
  /**
   * Couleur primaire merchant (pour le remplissage de la barre de progress).
   * Default : violet brand.
   */
  color?: string
  /**
   * Callback quand l'utilisateur clique sur la tache "Installer l'app".
   */
  onInstallClick: () => void
  /**
   * Callback quand l'utilisateur clique sur la tache "Ajouter au Wallet".
   */
  onWalletClick: () => void
  /**
   * Callback quand l'utilisateur clique sur la tache "Personnaliser ma carte".
   * Story 9.2 v2.
   */
  onCustomizeClick: () => void
}

const TASK_LABELS_FR: Record<OnboardingTaskId, string> = {
  card_created: 'Carte créée',
  pwa_installed: 'Installer l’app sur mon tel',
  wallet_added: 'Ajouter au Wallet',
  card_customized: 'Personnaliser ma carte',
}

export default function OnboardingProgressBanner({
  status,
  color = '#7F56D9',
  onInstallClick,
  onWalletClick,
  onCustomizeClick,
}: Props) {
  const doneCount = status.tasks.filter((t) => t.done).length
  const totalCount = status.tasks.length

  return (
    <section
      role="region"
      aria-label="Progression de configuration"
      className="md:hidden mx-5 my-4 rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-xs-skeumorphic"
    >
      {/* Header — title + counter + progress bar */}
      <header className="px-4 pt-3.5 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Lightning01 className="size-4 text-violet-600" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-gray-900">Configurez votre carte</h3>
          </div>
          <span className="text-xs font-medium text-gray-500" aria-live="polite">
            {doneCount}/{totalCount}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={status.percent}
          aria-label={`${status.percent}% complete`}
          className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden"
        >
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${status.percent}%`, backgroundColor: color }}
          />
        </div>
      </header>

      {/* Tasks list */}
      <ul className="divide-y divide-gray-100">
        {status.tasks.map((task) => {
          const label = TASK_LABELS_FR[task.id] ?? task.label
          const isClickable =
            !task.done &&
            (task.id === 'pwa_installed' ||
              task.id === 'wallet_added' ||
              task.id === 'card_customized')
          const handleClick =
            task.id === 'pwa_installed' ? onInstallClick :
            task.id === 'wallet_added' ? onWalletClick :
            task.id === 'card_customized' ? onCustomizeClick :
            undefined

          return (
            <li key={task.id}>
              {isClickable && handleClick ? (
                <button
                  type="button"
                  onClick={handleClick}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <TaskIcon done={task.done} />
                  <span className="flex-1 text-sm text-gray-900">{label}</span>
                  <ArrowRight className="size-4 text-gray-400 shrink-0" aria-hidden="true" />
                </button>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">
                  <TaskIcon done={task.done} />
                  <span className={`flex-1 text-sm ${task.done ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {label}
                  </span>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function TaskIcon({ done }: { done: boolean }) {
  if (done) {
    return (
      <CheckCircle
        className="size-5 text-green-500 shrink-0"
        aria-label="Fait"
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className="size-5 rounded-full border-2 border-gray-300 shrink-0"
    />
  )
}
