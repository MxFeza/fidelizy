'use client'

/**
 * Numeric input qui permet la saisie LIBRE (suppression du dernier chiffre,
 * empty intermediate) sans rejeter pendant la frappe.
 *
 * Bug user 2026-05-14 : avec un `<input type="number">` controlled qui rejette
 * les valeurs hors-range pendant onChange, impossible de passer de 5 a 15 (on
 * tape "1" → out of range → rejected → reste 5, on doit faire 5→55→15).
 *
 * Fix : 2 states. `draft` (string locale, affichee a l'ecran, libre).
 * `value` (number typed, source of truth parent). Sync :
 *   - onChange : maj draft toujours, maj value si parse OK et in-range
 *   - onBlur   : si draft invalide → revert draft a value
 *   - useEffect: si value change de l'exterieur (reset form, par ex) → resync draft
 */

import { useEffect, useState } from 'react'

interface NumberFieldDraftProps {
  value: number
  onChange: (next: number) => void
  /** Min/max inclusifs. Si vide → range non-bornee. */
  min?: number
  max?: number
  /** Mode parse. 'int' (parseInt) ou 'float' (parseFloat). */
  mode?: 'int' | 'float'
  /** Element props HTML (className, placeholder, aria, etc.). */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>
}

export default function NumberFieldDraft({
  value,
  onChange,
  min,
  max,
  mode = 'int',
  inputProps,
}: NumberFieldDraftProps) {
  const [draft, setDraft] = useState<string>(String(value))

  // Re-sync draft si la value parent change (ex: reset form, switch tier).
  useEffect(() => {
    setDraft(String(value))
  }, [value])

  function parse(s: string): number | null {
    if (s === '' || s === '-') return null
    const n = mode === 'int' ? parseInt(s, 10) : parseFloat(s)
    if (isNaN(n)) return null
    if (min !== undefined && n < min) return null
    if (max !== undefined && n > max) return null
    return n
  }

  return (
    <input
      type="text"
      inputMode={mode === 'float' ? 'decimal' : 'numeric'}
      value={draft}
      onChange={(e) => {
        const v = e.target.value
        // Permet saisie libre : empty + chiffres (+ point/virgule pour float)
        const allowed = mode === 'float' ? /^[0-9]*[.,]?[0-9]*$/ : /^[0-9]*$/
        if (!allowed.test(v)) return
        setDraft(v)
        const n = parse(v.replace(',', '.'))
        if (n !== null) onChange(n)
      }}
      onBlur={() => {
        const n = parse(draft.replace(',', '.'))
        if (n === null) {
          // Revert au value parent — la saisie etait invalide ou hors-range.
          setDraft(String(value))
        } else {
          // Normalise l'affichage (ex: "05" → "5", "5." → "5").
          setDraft(String(n))
        }
      }}
      {...inputProps}
    />
  )
}
