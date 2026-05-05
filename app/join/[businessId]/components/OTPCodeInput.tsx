'use client'

import { useRef } from 'react'

export type OTPStatus = 'idle' | 'invalid' | 'success'

interface OTPCodeInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  /** Auto-submit lorsque tous les chiffres sont saisis. Optionnel. */
  onComplete?: (code: string) => void
  disabled?: boolean
  status?: OTPStatus
}

/**
 * Saisie OTP visuelle 6 chiffres avec dash central, conforme Figma A5.0–A5.5.
 *
 * Status :
 *   - idle    : cases grises, chiffres saisis en noir
 *   - invalid : cases bordure rouge, chiffres rouges (Code incorrect)
 *   - success : cases bordure verte, chiffres verts (Code vérifié)
 *
 * Cases vides affichent "0" en placeholder (text-quaternary).
 */
export default function OTPCodeInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  status = 'idle',
}: OTPCodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dashIndex = Math.floor(length / 2)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) return
    const digits = e.target.value.replace(/\D/g, '').slice(0, length)
    onChange(digits)
    if (digits.length === length && onComplete) onComplete(digits)
  }

  function handlePaste(e: React.ClipboardEvent) {
    if (disabled) return
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    onChange(pasted)
    if (pasted.length === length && onComplete) onComplete(pasted)
  }

  const filledColor =
    status === 'invalid'
      ? 'text-error-primary'
      : status === 'success'
        ? 'text-success-primary'
        : 'text-primary'

  const borderColor =
    status === 'invalid'
      ? 'border-error_subtle'
      : status === 'success'
        ? 'border-success_subtle'
        : 'border-secondary'

  const activeRing =
    status === 'invalid'
      ? 'ring-error'
      : status === 'success'
        ? 'ring-success'
        : 'ring-brand'

  return (
    <div
      className="relative flex items-center justify-center gap-1.5 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern={`\\d{${length}}`}
        maxLength={length}
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        disabled={disabled}
        autoFocus
        className="absolute inset-0 w-full h-full opacity-0 z-10"
        aria-label="Code de vérification"
      />

      {Array.from({ length }).map((_, i) => {
        const isFilled = i < value.length
        const isActive = i === value.length && !disabled
        const display = isFilled ? value[i] : '0'

        return (
          <div key={i} className="flex items-center gap-1.5">
            {i === dashIndex && (
              <span className="text-2xl text-quaternary select-none mx-0.5">
                −
              </span>
            )}
            <div
              className={[
                'size-12 sm:size-13 flex items-center justify-center text-2xl font-semibold rounded-xl bg-primary border-2 transition-colors',
                borderColor,
                isFilled ? filledColor : 'text-quaternary',
                isActive && 'ring-2 ' + activeRing,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {display}
            </div>
          </div>
        )
      })}
    </div>
  )
}
