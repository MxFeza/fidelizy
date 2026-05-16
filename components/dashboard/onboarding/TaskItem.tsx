'use client'

/**
 * Story 9.1 — Item de tâche dans la checklist d'onboarding commerçant.
 *
 * 2 états visuels :
 *   - done=true  → check vert succès + texte barré atténué
 *   - done=false → cercle vide + texte primary, cliquable (curseur pointer)
 *
 * Au clic sur une tâche non-cochée :
 *   - Si `href` non null → navigation
 *   - Si `href` null     → déclenche le mini-tour driver.js via `onTriggerTour`
 *   - Si `tour` est précisé → `onTriggerTour(tour)` est prioritaire
 */

import { useRouter } from 'next/navigation'
import { CheckCircle, ArrowRight } from '@untitledui/icons'

interface TaskItemProps {
  /** Identifiant tâche (clé de tour driver.js si applicable). */
  id: string
  label: string
  done: boolean
  /** URL de navigation au clic, ou null pour déclencher un tour. */
  href?: string | null
  /** Callback : déclenche un mini-tour driver.js (passe l'id de tâche). */
  onTriggerTour?: (taskId: string) => void
}

export default function TaskItem({ id, label, done, href, onTriggerTour }: TaskItemProps) {
  const router = useRouter()

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    // Story 9.1.fix : triple safeguard pour éviter le bug "click on done task
    // re-déclenche l'action". L'attribut `disabled` ET le check JS ET
    // `pointer-events-none` côté CSS doivent tous trois empêcher l'action.
    if (done) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    if (onTriggerTour) {
      onTriggerTour(id)
      return
    }
    if (href) {
      router.push(href)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={done}
      aria-label={done ? `${label} (complété)` : label}
      className={`group w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left text-sm transition-colors ${
        done
          ? 'cursor-default pointer-events-none text-quaternary'
          : 'cursor-pointer text-primary hover:bg-primary_hover'
      }`}
    >
      {done ? (
        <CheckCircle className="size-4 shrink-0 text-fg-success-primary" />
      ) : (
        <span className="size-4 shrink-0 rounded-full border-2 border-secondary group-hover:border-brand-secondary transition-colors" />
      )}
      <span className={`flex-1 truncate ${done ? 'line-through' : 'font-medium'}`}>
        {label}
      </span>
      {!done && (
        <ArrowRight className="size-3.5 text-quaternary group-hover:text-brand-secondary transition-colors shrink-0" />
      )}
    </button>
  )
}
