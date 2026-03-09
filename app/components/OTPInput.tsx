'use client'

import { useRef, useState, useCallback } from 'react'

interface OTPInputProps {
  length?: number
  onComplete: (code: string) => void
  disabled?: boolean
}

export default function OTPInput({ length = 6, onComplete, disabled = false }: OTPInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const submittedRef = useRef(false)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const digits = e.target.value.replace(/\D/g, '').slice(0, length)
    setValue(digits)

    if (digits.length === length && !submittedRef.current) {
      submittedRef.current = true
      onComplete(digits)
      // Reset after a short delay to allow re-entry if code was invalid
      setTimeout(() => { submittedRef.current = false }, 1000)
    }
  }, [disabled, length, onComplete])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (disabled) return
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    setValue(pasted)

    if (pasted.length === length && !submittedRef.current) {
      submittedRef.current = true
      onComplete(pasted)
      setTimeout(() => { submittedRef.current = false }, 1000)
    }
  }, [disabled, length, onComplete])

  return (
    <div
      className="relative flex gap-2 justify-center cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Single hidden input for iOS one-time-code autofill */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={length}
        pattern={`\\d{${length}}`}
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        disabled={disabled}
        autoFocus
        className="absolute inset-0 w-full h-full opacity-0 z-10"
        aria-label="Code de vérification"
      />

      {/* Visual display of boxes */}
      {Array.from({ length }, (_, i) => (
        <div
          key={i}
          className={`w-11 h-13 flex items-center justify-center text-xl font-bold border-2 rounded-xl transition-colors ${
            disabled
              ? 'border-gray-200 bg-gray-50 text-gray-400'
              : i === value.length
                ? 'border-indigo-500 bg-white text-gray-900'
                : value[i]
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-200 bg-white text-gray-900'
          }`}
        >
          {value[i] || ''}
        </div>
      ))}
    </div>
  )
}
