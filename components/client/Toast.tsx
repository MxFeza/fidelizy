'use client'

import { CheckCircle, AlertTriangle, InfoCircle } from '@untitledui/icons'
import type { FC, HTMLAttributes } from 'react'
import { cx } from '@/utils/cx'

export type ToastVariant = 'info' | 'success' | 'error'

interface ToastProps {
  variant: ToastVariant
  title: string
  message?: string
  onDismiss?: () => void
  className?: string
}

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: FC<HTMLAttributes<HTMLOrSVGElement>>; bar: string; iconColor: string; titleColor: string }
> = {
  info: {
    icon: InfoCircle,
    bar: 'bg-blue-500',
    iconColor: 'text-blue-500',
    titleColor: 'text-gray-900',
  },
  success: {
    icon: CheckCircle,
    bar: 'bg-green-500',
    iconColor: 'text-green-500',
    titleColor: 'text-gray-900',
  },
  error: {
    icon: AlertTriangle,
    bar: 'bg-red-500',
    iconColor: 'text-red-500',
    titleColor: 'text-red-700',
  },
}

export default function Toast({ variant, title, message, onDismiss, className }: ToastProps) {
  const { icon: Icon, bar, iconColor, titleColor } = VARIANT_STYLES[variant]
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={cx(
        'flex items-stretch overflow-hidden bg-white rounded-xl shadow-lg ring-1 ring-gray-200/80 max-w-md',
        className,
      )}
    >
      <div className={cx('w-1 shrink-0', bar)} aria-hidden="true" />
      <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 min-w-0">
        <Icon className={cx('size-4 shrink-0', iconColor)} aria-hidden="true" />
        <p className="text-sm leading-snug min-w-0">
          <span className={cx('font-semibold', titleColor)}>{title}</span>
          {message ? <span className="text-gray-500 ml-1.5">{message}</span> : null}
        </p>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fermer"
          className="px-3 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
        >
          ×
        </button>
      ) : null}
    </div>
  )
}
