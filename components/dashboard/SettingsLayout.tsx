/**
 * Composants partages pour les pages /dashboard/settings/*.
 *
 * Garantit l'uniformite visuelle entre Mon entreprise / Securite / Abonnement
 * / Confidentialite : meme fond, meme spacing, meme hierarchie, memes cartes.
 *
 *   <SettingsPage>
 *     <SettingsHeader title="..." subtitle="..." />
 *     <SettingsSection icon={...} title="..." subtitle="...">
 *       ...content...
 *       <SectionFooter onSave={...} />
 *     </SettingsSection>
 *     <SettingsSection ...>
 *       ...
 *     </SettingsSection>
 *   </SettingsPage>
 *
 * Regles :
 *  - Fond uniforme : bg-primary (blanc) sur la page entiere
 *  - Cartes : bg-primary, ring-1 ring-secondary, rounded-xl, shadow-xs
 *  - Layout : 2-col desktop (sidebar 280px + content), 1-col mobile
 *  - Spacing : gap-8 (mobile) / gap-12 (desktop) entre sections
 *  - Padding cartes : p-4 (mobile) / p-6 (desktop)
 *  - Header : 1 hierarchie unique (display-xs/display-sm + tertiary subtitle)
 */

'use client'

import { CheckDone01 } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'

export function SettingsPage({ children }: { children: React.ReactNode }) {
  return <div className="bg-primary min-h-full">{children}</div>
}

interface SettingsHeaderProps {
  title: string
  subtitle?: string
  /** Slot a droite : actions (boutons par ex.). */
  actions?: React.ReactNode
  /** Slot avant le titre : avatar / logo. */
  leading?: React.ReactNode
}

export function SettingsHeader({ title, subtitle, actions, leading }: SettingsHeaderProps) {
  return (
    <header className="border-b border-secondary">
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1080px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          {leading}
          <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <h1 className="text-display-xs md:text-display-sm font-semibold text-primary truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm md:text-md text-tertiary mt-1 truncate">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
        </div>
      </div>
    </header>
  )
}

export function SettingsBody({ children }: { children: React.ReactNode }) {
  return (
    <main className="px-4 md:px-8 py-6 md:py-12 flex flex-col gap-8 md:gap-12 max-w-[1080px] w-full mx-auto">
      {children}
    </main>
  )
}

interface SettingsSectionProps {
  /** Icone affichee dans la pastille brand de la sidebar gauche. */
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle: string
  children: React.ReactNode
}

export function SettingsSection({ icon: Icon, title, subtitle, children }: SettingsSectionProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 md:gap-8">
      <div className="flex md:flex-col items-start gap-3">
        <div className="size-9 rounded-lg bg-brand-secondary flex items-center justify-center shrink-0">
          <Icon className="size-4 text-fg-brand-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-secondary">{title}</h2>
          <p className="text-sm text-tertiary mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="bg-primary rounded-xl ring-1 ring-secondary shadow-xs">
        <div className="p-4 md:p-6 flex flex-col gap-5">{children}</div>
      </div>
    </section>
  )
}

interface SectionFooterProps {
  isDirty: boolean
  isSaving: boolean
  isSaved: boolean
  onSave: () => void
  disabled?: boolean
  saveLabel?: string
}

export function SectionFooter({
  isDirty,
  isSaving,
  isSaved,
  onSave,
  disabled,
  saveLabel = 'Enregistrer',
}: SectionFooterProps) {
  return (
    <div className="-mx-4 md:-mx-6 -mb-4 md:-mb-6 mt-2 px-4 md:px-6 py-4 border-t border-secondary flex items-center justify-end gap-3">
      {isSaved && (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success-primary">
          <CheckDone01 className="size-4" />
          Enregistré
        </span>
      )}
      <Button
        size="sm"
        color="primary"
        onClick={onSave}
        isDisabled={!isDirty || isSaving || disabled}
        isLoading={isSaving}
      >
        {saveLabel}
      </Button>
    </div>
  )
}
