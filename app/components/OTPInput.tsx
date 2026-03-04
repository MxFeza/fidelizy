'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface OTPInputProps {
  length?: number
  onComplete: (code: string) => void
  disabled?: boolean
}

export default function OTPInput({ length = 6, onComplete, disabled = false }: OTPInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''))
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  const submitCode = useCallback((vals: string[]) => {
    const code = vals.join('')
    if (code.length === length) {
      onComplete(code)
    }
  }, [length, onComplete])

  function handleChange(index: number, value: string) {
    if (disabled) return
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...values]
    next[index] = digit
    setValues(next)

    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }

    if (digit && index === length - 1) {
      submitCode(next)
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      const next = [...values]
      next[index - 1] = ''
      setValues(next)
      inputsRef.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    if (disabled) return
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return

    const next = [...values]
    for (let i = 0; i < length; i++) {
      next[i] = pasted[i] || ''
    }
    setValues(next)

    const focusIndex = Math.min(pasted.length, length - 1)
    inputsRef.current[focusIndex]?.focus()

    if (pasted.length >= length) {
      submitCode(next)
    }
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-11 h-13 text-center text-xl font-bold border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
      ))}
    </div>
  )
}
