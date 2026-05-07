'use client'

/**
 * ProfileModal — modal primitive pour la page profil client (Story 4.7 v2).
 * Bottom-sheet sur mobile, centré sur desktop. Cercle icon + titre + texte + actions.
 * Pattern réutilisé par les 6 modals : avatar, feedback, export, logout, delete-step1/step2.
 */

import { useEffect, type ComponentType, type HTMLAttributes, type ReactNode } from 'react'
import { CheckCircle, AlertTriangle, AlertCircle } from '@untitledui/icons'
import { cx } from '@/utils/cx'

export type ProfileModalIcon = 'success' | 'warning' | 'danger'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  icon: ProfileModalIcon
  title: string
  description?: ReactNode
  /** Contenu additionnel entre la description et les actions (input texte, etc.). */
  children?: ReactNode
  actions: ReactNode
  /** Empêche fermeture par overlay/Escape (utile pendant un loading). */
  isBlocking?: boolean
}

const ICON_STYLES: Record<
  ProfileModalIcon,
  { Icon: ComponentType<HTMLAttributes<HTMLOrSVGElement>>; ring: string; bg: string; color: string }
> = {
  success: { Icon: CheckCircle, ring: 'ring-green-100', bg: 'bg-green-50', color: 'text-green-600' },
  warning: { Icon: AlertTriangle, ring: 'ring-yellow-100', bg: 'bg-yellow-50', color: 'text-yellow-600' },
  danger: { Icon: AlertCircle, ring: 'ring-red-100', bg: 'bg-red-50', color: 'text-red-600' },
}

export default function ProfileModal({
  isOpen,
  onClose,
  icon,
  title,
  description,
  children,
  actions,
  isBlocking = false,
}: ProfileModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBlocking) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, isBlocking, onClose])

  if (!isOpen) return null

  const { Icon, ring, bg, color } = ICON_STYLES[icon]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center"
      onClick={() => !isBlocking && onClose()}
    >
      <div
        className="w-full md:max-w-sm bg-white rounded-t-2xl md:rounded-2xl p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div className={cx('size-12 rounded-full flex items-center justify-center ring-8', ring, bg)}>
            <Icon className={cx('size-6', color)} aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 id="profile-modal-title" className="text-lg font-bold text-gray-900">
              {title}
            </h2>
            {description ? (
              <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
            ) : null}
          </div>
        </div>

        {children}

        <div className="flex flex-col gap-2 pt-1">{actions}</div>
      </div>
    </div>
  )
}
