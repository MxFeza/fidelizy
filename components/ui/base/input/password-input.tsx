'use client'

/**
 * PasswordInput — variante de l'Input avec toggle "afficher/masquer le mot de passe".
 * Bati sur les memes primitives que Input (react-aria-components + tokens Untitled UI).
 */

import { useState, type Ref } from 'react'
import { Eye, EyeOff } from '@untitledui/icons'
import type { TextFieldProps as AriaTextFieldProps } from 'react-aria-components'
import { Group as AriaGroup, Input as AriaInput, TextField as AriaTextField } from 'react-aria-components'
import { HintText } from '@/components/ui/base/input/hint-text'
import { Label } from '@/components/ui/base/input/label'
import { cx } from '@/utils/cx'

interface PasswordInputProps extends Omit<AriaTextFieldProps, 'type'> {
  label?: string
  hint?: string
  placeholder?: string
  size?: 'sm' | 'md'
  hideRequiredIndicator?: boolean
  ref?: Ref<HTMLInputElement>
}

export function PasswordInput({
  label,
  hint,
  placeholder,
  size = 'sm',
  hideRequiredIndicator,
  ref,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  const padding = size === 'md' ? 'px-3.5 py-2.5' : 'px-3 py-2'

  return (
    <AriaTextField {...props} className="group flex w-full flex-col gap-1.5">
      {({ isRequired, isInvalid }) => (
        <>
          {label && (
            <Label isRequired={hideRequiredIndicator ? false : isRequired}>{label}</Label>
          )}

          <AriaGroup
            isInvalid={isInvalid}
            isDisabled={props.isDisabled}
            className={({ isFocusWithin, isDisabled, isInvalid }) =>
              cx(
                'relative flex w-full items-center rounded-lg bg-primary shadow-xs ring-1 ring-primary ring-inset transition-shadow duration-100 ease-linear',
                isFocusWithin && !isDisabled && 'ring-2 ring-brand',
                isDisabled && 'cursor-not-allowed bg-disabled_subtle ring-disabled',
                isInvalid && 'ring-error_subtle',
                isInvalid && isFocusWithin && 'ring-2 ring-error',
              )
            }
          >
            <AriaInput
              ref={ref}
              type={visible ? 'text' : 'password'}
              placeholder={placeholder}
              className={cx(
                'm-0 w-full bg-transparent text-md text-primary outline-hidden ring-0 placeholder:text-placeholder',
                padding,
                'pr-10',
              )}
            />

            <button
              type="button"
              tabIndex={-1}
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              aria-pressed={visible}
              className="absolute right-2 inline-flex size-7 items-center justify-center rounded-md text-fg-quaternary hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring transition-colors"
            >
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </AriaGroup>

          {hint && <HintText isInvalid={isInvalid}>{hint}</HintText>}
        </>
      )}
    </AriaTextField>
  )
}
