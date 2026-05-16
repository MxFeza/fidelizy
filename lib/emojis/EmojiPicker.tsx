'use client'

import { useMemo, useState } from 'react'
import { cx } from '@/utils/cx'
import { Emoji } from './Emoji'
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  BUSINESS_TYPE_SUGGESTIONS,
  DEFAULT_SUGGESTIONS,
  EMOJI_CATALOG,
  getEmojisByCategory,
  lookupByUnicode,
  type EmojiCategory,
  type EmojiName,
} from './emoji-mapping'
import type { BusinessType } from '@/lib/types'

interface EmojiPickerProps {
  /** Valeur courante stockée en Unicode (rétrocompat avec `business.reward_tiers[].emoji`). */
  value: string
  /** Renvoie l'Unicode du catalogue Izou — stocké tel quel en DB. */
  onChange: (unicode: string) => void
  businessType?: BusinessType | null
  /** Taille du bouton trigger. */
  triggerSize?: 'md' | 'lg'
  triggerLabel?: string
}

/**
 * Picker d'emoji popover-style basé sur le catalogue Izou (Microsoft Fluent Emoji).
 *
 * - Affiche les suggestions du `businessType` en haut.
 * - Onglets catégorie en dessous (Boissons, Pâtisseries, Coiffure, etc.).
 * - Stocke en Unicode pour rester compatible avec les paliers DB existants.
 */
export function EmojiPicker({
  value,
  onChange,
  businessType,
  triggerSize = 'lg',
  triggerLabel = 'Choisir un emoji',
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<EmojiCategory>('rewards')

  const suggestions = useMemo<EmojiName[]>(() => {
    if (businessType && BUSINESS_TYPE_SUGGESTIONS[businessType]) {
      return BUSINESS_TYPE_SUGGESTIONS[businessType]
    }
    return DEFAULT_SUGGESTIONS
  }, [businessType])

  const currentName = useMemo(() => lookupByUnicode(value), [value])

  function pick(name: EmojiName) {
    onChange(EMOJI_CATALOG[name].unicode)
    setOpen(false)
  }

  const triggerClass =
    triggerSize === 'lg'
      ? 'size-12 sm:size-14'
      : 'size-10'

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={triggerLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cx(
          'rounded-lg bg-secondary/40 hover:bg-secondary transition-colors flex items-center justify-center',
          triggerClass,
        )}
      >
        {currentName ? (
          <Emoji name={currentName} size={triggerSize === 'lg' ? 36 : 28} />
        ) : value ? (
          <Emoji unicode={value} size={triggerSize === 'lg' ? 36 : 28} />
        ) : (
          <Emoji name="gift" size={triggerSize === 'lg' ? 36 : 28} />
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div
            role="dialog"
            aria-label="Sélecteur d'emoji"
            className="absolute z-20 mt-2 left-0 w-[min(20rem,calc(100vw-2rem))] max-h-[24rem] overflow-hidden rounded-xl border border-secondary bg-primary shadow-xl flex flex-col"
          >
            {/* Suggestions métier */}
            <div className="px-3 pt-3 pb-2 border-b border-secondary">
              <p className="text-[11px] uppercase tracking-wide font-semibold text-tertiary mb-2">
                Suggestions
              </p>
              <div className="grid grid-cols-8 gap-1">
                {suggestions.map((name) => (
                  <EmojiButton
                    key={`sugg-${name}`}
                    name={name}
                    selected={currentName === name}
                    onClick={() => pick(name)}
                  />
                ))}
              </div>
            </div>

            {/* Tabs catégorie */}
            <div className="flex gap-1 overflow-x-auto px-2 py-2 border-b border-secondary scrollbar-thin">
              {CATEGORY_ORDER.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={cx(
                    'shrink-0 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
                    activeCategory === cat
                      ? 'bg-brand-primary text-fg-brand-primary_alt'
                      : 'text-tertiary hover:bg-secondary/60',
                  )}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {/* Grille emojis catégorie active */}
            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-8 gap-1">
                {getEmojisByCategory(activeCategory).map((name) => (
                  <EmojiButton
                    key={name}
                    name={name}
                    selected={currentName === name}
                    onClick={() => pick(name)}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function EmojiButton({
  name,
  selected,
  onClick,
}: {
  name: EmojiName
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={EMOJI_CATALOG[name].label}
      title={EMOJI_CATALOG[name].label}
      className={cx(
        'size-8 rounded-md flex items-center justify-center transition-colors',
        selected ? 'bg-brand-secondary' : 'hover:bg-secondary/60',
      )}
    >
      <Emoji name={name} size={22} />
    </button>
  )
}
