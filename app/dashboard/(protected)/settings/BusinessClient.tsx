'use client'

/**
 * Mon entreprise (Story 8.1) — sous-page de Reglages.
 *
 * Recentre sur les infos du commerce uniquement :
 *   - Nom commercial
 *   - Couleur primaire
 *   - Type de metier (sert aux suggestions de recompense)
 *   - Code commerce (lecture seule + copie + lien d'inscription clients)
 *
 * La configuration du programme de fidelite (tampons/points/paliers/cooldown)
 * a ete deplacee vers /dashboard/marketing/loyalty pour eviter la duplication
 * d'ecran (deux pages ecrivaient sur les memes colonnes business).
 */

import { useEffect, useMemo, useState } from 'react'
import { Building07, Copy01, CheckDone01, AlertCircle, ArrowRight } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import { Input } from '@/components/ui/base/input/input'
import { createClient } from '@/lib/supabase/client'
import type { BusinessType } from '@/lib/types'
import { cx } from '@/utils/cx'

type BusinessSlim = {
  id: string
  business_name: string
  primary_color: string | null
  business_type: BusinessType | null
  short_code: string | null
  logo_url: string | null
}

interface BusinessClientProps {
  business: BusinessSlim
}

const PRESET_COLORS: { label: string; value: string }[] = [
  { label: 'Violet', value: '#7F56D9' },
  { label: 'Bleu', value: '#2563EB' },
  { label: 'Indigo', value: '#4F46E5' },
  { label: 'Vert', value: '#16A34A' },
  { label: 'Orange', value: '#EA580C' },
  { label: 'Rose', value: '#E11D48' },
]

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: 'cafe', label: 'Café' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'bakery', label: 'Boulangerie' },
  { value: 'snack', label: 'Snack' },
  { value: 'hair', label: 'Coiffeur' },
  { value: 'nails', label: 'Onglerie' },
]

export default function BusinessClient({ business }: BusinessClientProps) {
  const supabase = createClient()

  const [name, setName] = useState(business.business_name)
  const [color, setColor] = useState(business.primary_color ?? '#7F56D9')
  const [type, setType] = useState<BusinessType | null>(business.business_type)

  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const isDirty = useMemo(() => (
    name !== business.business_name ||
    color !== (business.primary_color ?? '#7F56D9') ||
    type !== business.business_type
  ), [name, color, type, business])

  useEffect(() => {
    if (!savedAt) return
    const t = setTimeout(() => setSavedAt(null), 3000)
    return () => clearTimeout(t)
  }, [savedAt])

  async function handleSave() {
    if (!isDirty) return
    setSaving(true)
    setError(null)
    try {
      const { error: dbError } = await supabase
        .from('businesses')
        .update({
          business_name: name.trim(),
          primary_color: color,
          business_type: type,
        })
        .eq('id', business.id)

      if (dbError) throw dbError
      setSavedAt(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCopyCode() {
    if (!business.short_code) return
    try {
      await navigator.clipboard.writeText(business.short_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore — pas de fallback necessaire
    }
  }

  const joinUrl = business.short_code
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?code=${business.short_code}`
    : ''

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-display-xs font-semibold text-primary">Mon entreprise</h1>
        <p className="text-sm text-tertiary mt-1">Personnalisez l&apos;identité de votre commerce.</p>
      </div>

      <div className="space-y-4">
        {/* Identite */}
        <section className="bg-primary rounded-xl ring-1 ring-secondary shadow-xs p-5 md:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="size-9 rounded-lg bg-brand-secondary flex items-center justify-center">
              <Building07 className="size-4 text-fg-brand-primary" />
            </div>
            <p className="text-sm font-semibold text-primary">Identité</p>
          </div>

          <div className="space-y-4">
            <Input
              label="Nom du commerce"
              value={name}
              onChange={setName}
              isRequired
              placeholder="Ex : Café de la place"
            />

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Couleur principale
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={cx(
                      'size-9 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer',
                      color === c.value ? 'ring-2 ring-offset-2 ring-brand' : 'border-transparent',
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                    aria-label={c.label}
                    aria-pressed={color === c.value}
                  />
                ))}
                <label className="flex items-center gap-2 ml-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="size-9 rounded-lg border border-secondary cursor-pointer p-0.5"
                  />
                  <span className="text-xs text-tertiary">Personnalisée</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Type de commerce */}
        <section className="bg-primary rounded-xl ring-1 ring-secondary shadow-xs p-5 md:p-6">
          <p className="text-sm font-semibold text-primary mb-1">Type de commerce</p>
          <p className="text-xs text-tertiary mb-4">
            Sert à proposer des suggestions de récompenses adaptées à votre métier.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BUSINESS_TYPES.map(({ value, label }) => {
              const active = type === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={cx(
                    'px-4 py-3 rounded-lg ring-1 text-sm font-medium transition-colors cursor-pointer',
                    active
                      ? 'ring-2 ring-brand bg-brand-secondary text-brand-secondary'
                      : 'ring-secondary bg-primary text-secondary hover:bg-secondary',
                  )}
                  aria-pressed={active}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </section>

        {/* Code commerce */}
        {business.short_code && (
          <section className="bg-primary rounded-xl ring-1 ring-secondary shadow-xs p-5 md:p-6">
            <p className="text-sm font-semibold text-primary mb-1">Code commerce</p>
            <p className="text-xs text-tertiary mb-4">
              Vos clients utilisent ce code pour rejoindre votre programme.
            </p>

            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-2.5 bg-secondary rounded-lg font-mono text-sm font-semibold text-primary tracking-wider">
                {business.short_code}
              </code>
              <Button
                size="sm"
                color="secondary"
                iconLeading={copied ? CheckDone01 : Copy01}
                onClick={handleCopyCode}
              >
                {copied ? 'Copié' : 'Copier'}
              </Button>
            </div>

            {joinUrl && (
              <p className="text-xs text-tertiary mt-3">
                Lien d&apos;inscription : <a href={joinUrl} target="_blank" rel="noreferrer" className="text-brand-secondary hover:underline">{joinUrl}</a>
              </p>
            )}
          </section>
        )}

        {/* Pointer vers Marketing pour la config fidelite */}
        <section className="bg-secondary rounded-xl ring-1 ring-secondary p-5 md:p-6">
          <p className="text-sm font-semibold text-primary mb-1">Programme de fidélité</p>
          <p className="text-xs text-tertiary mb-4">
            La configuration des tampons, points, paliers et délai anti-fraude est dans <strong className="font-medium text-secondary">Marketing &gt; Programme de fidélité</strong>.
          </p>
          <Button
            size="sm"
            color="link-color"
            href="/dashboard/marketing/loyalty"
            iconTrailing={ArrowRight}
          >
            Configurer le programme
          </Button>
        </section>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 sticky bottom-4 md:static bg-primary rounded-xl shadow-md md:shadow-none p-4 md:p-0 ring-1 ring-secondary md:ring-0">
          <Button
            size="sm"
            color="primary"
            onClick={handleSave}
            isDisabled={!isDirty || saving || name.trim().length === 0}
            isLoading={saving}
          >
            Sauvegarder
          </Button>

          {savedAt && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success-primary">
              <CheckDone01 className="size-4" />
              Enregistré
            </span>
          )}
          {error && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-error-primary">
              <AlertCircle className="size-4" />
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
