'use client'

/* eslint-disable react-hooks/set-state-in-effect --
 * Ce composant utilise plusieurs patterns SSR-safe / DOM-dependent qui
 * nécessitent setState dans des effects (mounted flag, target rect computed
 * after layout, target query after navigation). Tous sont synchronisés avec
 * le DOM externe et ne déclenchent pas de cascading re-renders en pratique.
 */

/**
 * Story 9.1.fix — Coachmark interactif Untitled UI.
 *
 * Remplace driver.js. Affiche un overlay sombre + un trou rectangulaire
 * autour de l'élément cible (highlight) + un popover compact à proximité.
 *
 * Pourquoi pas driver.js : popovers trop statiques, style générique, et le
 * user attend une avance auto sur action (clic/change), pas via "Suivant".
 *
 * Pourquoi pas AriaPopover : on n'a pas de Trigger DOM (la cible est un
 * sélecteur CSS calculé dynamiquement). On compose donc avec :
 *   - un portal vers <body>
 *   - 4 divs d'overlay autour du rect cible (le rect lui-même reste cliquable)
 *   - une carte popover positionnée au-dessus/en-dessous selon l'espace
 *
 * Tokens Untitled UI : bg-primary, bg-overlay, text-primary, text-tertiary,
 * border-secondary, fg-brand-primary, etc. Pas de Tailwind direct.
 */

import { useEffect, useRef, useState, useCallback, type FC } from 'react'
import { createPortal } from 'react-dom'
import { X as CloseIcon, ArrowLeft, ArrowRight } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import { FeaturedIcon } from '@/components/ui/foundations/featured-icon/featured-icon'

export type CoachmarkAdvanceTrigger = 'click' | 'change' | 'submit' | 'manual'

export interface CoachmarkStep {
  /** Identifiant unique pour le step (stable, sert de key React). */
  id: string
  /** Sélecteur CSS de l'élément à highlighter. Si null/introuvable → popover centré. */
  targetSelector?: string
  /** Icône Untitled UI lineart à afficher dans le FeaturedIcon header. */
  icon: FC
  /** Titre court ≤40 chars, label-style. */
  title: string
  /** Description courte ≤80 chars, optionnelle. */
  description?: string
  /** Comment le step avance. 'manual' = bouton Suivant ; 'click'/'change'/'submit' = écoute auto sur target. */
  advanceOn?: CoachmarkAdvanceTrigger
}

interface CoachmarkProps {
  step: CoachmarkStep
  /** 1-indexed step number for progress display. */
  current: number
  total: number
  onAdvance: () => void
  onClose: () => void
  /** Affiche bouton Précédent si fourni (current > 1). */
  onPrev?: () => void
}

const SPACING = 12 // distance entre target et popover
const POPOVER_WIDTH = 320
const POPOVER_PADDING = 16

export default function Coachmark({
  step,
  current,
  total,
  onAdvance,
  onClose,
  onPrev,
}: CoachmarkProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [mounted, setMounted] = useState(false)
  const advancedRef = useRef(false)

  // Track DOM mount (portal needs document.body — SSR-safe). The
  // setMounted-in-effect pattern is intentional to align server/client
  // initial render before the portal target exists.
  useEffect(() => {
    setMounted(true)
  }, [])

  // Compute and update target rect on layout changes
  useEffect(() => {
    if (!step.targetSelector) {
      setTargetRect(null)
      return
    }

    function update() {
      const el = document.querySelector(step.targetSelector!)
      if (!(el instanceof HTMLElement)) {
        setTargetRect(null)
        return
      }
      const rect = el.getBoundingClientRect()
      setTargetRect(rect)
      // Scroll into view si hors écran (centre vertical)
      if (rect.top < 80 || rect.bottom > window.innerHeight - 80) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }

    // Initial + retries (target peut apparaître après hydration / data fetch)
    update()
    const t1 = setTimeout(update, 200)
    const t2 = setTimeout(update, 600)

    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [step.targetSelector])

  // Auto-advance listener on target
  useEffect(() => {
    advancedRef.current = false
    if (!step.targetSelector) return
    const advanceOn = step.advanceOn ?? 'manual'
    if (advanceOn === 'manual') return

    const el = document.querySelector(step.targetSelector)
    if (!(el instanceof HTMLElement)) return

    function handler() {
      if (advancedRef.current) return
      advancedRef.current = true
      // Small delay so the user perceives the action register before advancing
      setTimeout(() => {
        onAdvance()
      }, 450)
    }

    // Bubble phase so les state updates des enfants ont le temps de s'appliquer
    // avant qu'on avance le step (ex: setLoyaltyType('stamps') doit s'exécuter
    // avant qu'on retire le coachmark).
    el.addEventListener(advanceOn, handler)
    return () => {
      el.removeEventListener(advanceOn, handler)
    }
  }, [step.id, step.targetSelector, step.advanceOn, onAdvance])

  // Escape closes
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleManualAdvance = useCallback(() => {
    if (advancedRef.current) return
    advancedRef.current = true
    onAdvance()
  }, [onAdvance])

  if (!mounted) return null

  const showProgress = total > 1
  const showNext = (step.advanceOn ?? 'manual') === 'manual'

  // ---- Compute popover position ----
  let popoverStyle: React.CSSProperties
  let highlightStyle: React.CSSProperties | null = null

  if (targetRect) {
    // Highlight ring around target. Dim léger (0.35) pour laisser l'UI visible
    // derrière comme dans les patterns Usetiful/Linear, plus border brand visible
    // pour bien démarquer la zone à cliquer.
    highlightStyle = {
      position: 'fixed',
      top: targetRect.top - 4,
      left: targetRect.left - 4,
      width: targetRect.width + 8,
      height: targetRect.height + 8,
      borderRadius: 12,
      pointerEvents: 'none',
      boxShadow:
        '0 0 0 2px rgb(127 86 217), 0 0 0 9999px rgba(12, 17, 29, 0.35)',
      zIndex: 70,
    }

    // Popover placement: prefer below, fall back to above
    const spaceBelow = window.innerHeight - targetRect.bottom
    const spaceAbove = targetRect.top
    const placeBelow = spaceBelow >= 220 || spaceBelow >= spaceAbove

    const top = placeBelow
      ? Math.min(
          targetRect.bottom + SPACING,
          window.innerHeight - 240, // garde-fou bas
        )
      : Math.max(targetRect.top - 220 - SPACING, 16)

    // Center popover horizontally on target, then clamp to viewport
    let left = targetRect.left + targetRect.width / 2 - POPOVER_WIDTH / 2
    left = Math.max(POPOVER_PADDING, Math.min(left, window.innerWidth - POPOVER_WIDTH - POPOVER_PADDING))

    popoverStyle = {
      position: 'fixed',
      top,
      left,
      width: POPOVER_WIDTH,
      zIndex: 80,
    }
  } else {
    // Fallback : si la cible est introuvable (page pas encore prête, ou pas la
    // bonne page), on affiche le popover en bas-droite sans backdrop pour
    // ne pas masquer toute la page.
    popoverStyle = {
      position: 'fixed',
      bottom: 24,
      right: 24,
      width: POPOVER_WIDTH,
      zIndex: 80,
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={`coachmark-title-${step.id}`}
      aria-describedby={step.description ? `coachmark-desc-${step.id}` : undefined}
    >
      {/* Highlight ring around target (pointer-events: none → clicks pass through) */}
      {highlightStyle && <div style={highlightStyle} aria-hidden="true" />}

      {/* Popover card */}
      <div
        style={popoverStyle}
        className="rounded-xl bg-primary border border-secondary shadow-lg overflow-hidden"
      >
        {/* Header row: featured icon + title + close */}
        <div className="flex items-start gap-3 p-4 pb-3">
          <FeaturedIcon
            icon={step.icon}
            color="brand"
            theme="light"
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p
              id={`coachmark-title-${step.id}`}
              className="text-sm font-semibold text-primary leading-tight"
            >
              {step.title}
            </p>
            {step.description && (
              <p
                id={`coachmark-desc-${step.id}`}
                className="text-sm text-tertiary mt-1 leading-snug"
              >
                {step.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="size-7 inline-flex items-center justify-center rounded-md text-quaternary hover:text-primary hover:bg-primary_hover transition-colors shrink-0"
          >
            <CloseIcon className="size-4" aria-hidden="true" />
          </button>
        </div>

        {/* Footer row: progress + actions */}
        {(showProgress || onPrev || showNext) && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-secondary bg-secondary">
            <div className="flex items-center gap-1.5">
              {showProgress &&
                Array.from({ length: total }).map((_, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className={
                      i + 1 === current
                        ? 'size-1.5 rounded-full bg-fg-brand-primary'
                        : 'size-1.5 rounded-full bg-quaternary'
                    }
                  />
                ))}
            </div>
            <div className="flex items-center gap-2">
              {onPrev && (
                <Button
                  size="sm"
                  color="tertiary"
                  iconLeading={ArrowLeft}
                  onClick={onPrev}
                >
                  Précédent
                </Button>
              )}
              {showNext &&
                (current === total ? (
                  <Button size="sm" color="primary" onClick={handleManualAdvance}>
                    Terminer
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    color="primary"
                    iconTrailing={ArrowRight}
                    onClick={handleManualAdvance}
                  >
                    Suivant
                  </Button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
