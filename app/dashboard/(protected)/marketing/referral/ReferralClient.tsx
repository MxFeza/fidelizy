'use client'

/**
 * Page Parrainage (Story 5.4 — Figma H1c, FR33).
 * Permet au commercant d'activer/desactiver le parrainage et de configurer
 * les bonus offerts au parrain et au filleul.
 *
 * Le bonus est exprime en tampons OU points selon `business.loyalty_type`.
 */

import { useEffect, useMemo, useState } from 'react'
import { Users01, CheckDone01, Loading01, AlertCircle, Heart, Trophy01 } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import { Input } from '@/components/ui/base/input/input'
import { Toggle } from '@/components/ui/base/toggle/toggle'
import { createClient } from '@/lib/supabase/client'
import type { Business } from '@/lib/types'

interface ReferralClientProps {
  business: Business
  stats: {
    total: number
    thisMonth: number
  }
}

export default function ReferralClient({ business, stats }: ReferralClientProps) {
  const [enabled, setEnabled] = useState(business.referral_enabled)
  const [referrerBonus, setReferrerBonus] = useState(business.referral_referrer_bonus)
  const [referredBonus, setReferredBonus] = useState(business.referral_referred_bonus)

  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const unit = business.loyalty_type === 'points' ? 'points' : 'tampons'

  const isDirty = useMemo(() => (
    enabled !== business.referral_enabled ||
    referrerBonus !== business.referral_referrer_bonus ||
    referredBonus !== business.referral_referred_bonus
  ), [enabled, referrerBonus, referredBonus, business])

  useEffect(() => {
    if (!savedAt) return
    const t = setTimeout(() => setSavedAt(null), 3000)
    return () => clearTimeout(t)
  }, [savedAt])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: dbError } = await supabase
        .from('businesses')
        .update({
          referral_enabled: enabled,
          referral_referrer_bonus: Math.max(0, Math.floor(referrerBonus)),
          referral_referred_bonus: Math.max(0, Math.floor(referredBonus)),
        })
        .eq('id', business.id)

      if (dbError) {
        setError(dbError.message)
        return
      }
      setSavedAt(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-display-xs sm:text-display-sm font-semibold text-primary">
            Parrainage
          </h1>
          <p className="text-md text-tertiary mt-1">
            Récompensez vos clients qui font venir leurs amis.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="inline-flex items-center gap-1.5 text-sm text-success-primary">
              <CheckDone01 className="size-4" />
              Enregistré
            </span>
          )}
          {error && (
            <span className="inline-flex items-center gap-1.5 text-sm text-error-primary">
              <AlertCircle className="size-4" />
              {error}
            </span>
          )}
          <Button
            color="primary"
            size="md"
            isDisabled={!isDirty || saving}
            iconLeading={saving ? Loading01 : undefined}
            onClick={handleSave}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          icon={Users01}
          label="Parrainages totaux"
          value={stats.total}
        />
        <StatCard
          icon={Heart}
          label="Ce mois-ci"
          value={stats.thisMonth}
          highlight
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Toggle */}
          <section className="rounded-xl bg-primary border border-secondary p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-primary mb-1">Activer le parrainage</h2>
                <p className="text-sm text-tertiary">
                  Vos clients pourront partager un lien avec leurs amis. Quand un nouveau client s&apos;inscrit
                  via ce lien, le parrain et le filleul reçoivent un bonus.
                </p>
              </div>
              <Toggle
                isSelected={enabled}
                onChange={setEnabled}
                aria-label="Activer le parrainage"
              />
            </div>
          </section>

          {/* Bonus config */}
          <section className={`rounded-xl bg-primary border border-secondary p-5 sm:p-6 space-y-5 transition-opacity ${enabled ? '' : 'opacity-60'}`}>
            <div>
              <h2 className="text-lg font-semibold text-primary mb-1">Bonus offerts</h2>
              <p className="text-sm text-tertiary">
                Définis en {unit} (selon votre programme actuel).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Bonus parrain
                </label>
                <Input
                  type="number"
                  value={String(referrerBonus)}
                  onChange={(v) => {
                    const n = parseInt(v, 10)
                    if (!isNaN(n) && n >= 0 && n <= 100) setReferrerBonus(n)
                  }}
                  isDisabled={!enabled}
                  hint={`${referrerBonus} ${unit} pour le client qui parraine`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Bonus filleul
                </label>
                <Input
                  type="number"
                  value={String(referredBonus)}
                  onChange={(v) => {
                    const n = parseInt(v, 10)
                    if (!isNaN(n) && n >= 0 && n <= 100) setReferredBonus(n)
                  }}
                  isDisabled={!enabled}
                  hint={`${referredBonus} ${unit} pour le nouveau client`}
                />
              </div>
            </div>

            <div className="rounded-lg bg-brand-secondary/30 border border-brand/20 p-4">
              <p className="text-xs font-semibold text-fg-brand-primary uppercase tracking-wide mb-2">
                Comment ça marche ?
              </p>
              <ul className="space-y-1.5 text-sm text-secondary">
                <li className="flex gap-2">
                  <span className="text-fg-brand-primary font-semibold">1.</span>
                  <span>Vos clients partagent leur lien de parrainage personnel.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-fg-brand-primary font-semibold">2.</span>
                  <span>Un ami clique et s&apos;inscrit à votre carte de fidélité.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-fg-brand-primary font-semibold">3.</span>
                  <span>
                    Le parrain reçoit <strong>{referrerBonus} {unit}</strong>, le nouveau client reçoit{' '}
                    <strong>{referredBonus} {unit}</strong> de bienvenue.
                  </span>
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* Visual */}
        <aside className="lg:col-span-5 lg:sticky lg:top-6 self-start">
          <div className="rounded-xl bg-secondary/40 border border-secondary p-5 sm:p-6">
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wide mb-4">
              Aperçu côté client
            </p>
            <div className="rounded-2xl bg-primary border border-secondary p-6 text-center space-y-4">
              <div className="size-14 mx-auto rounded-full bg-brand-secondary flex items-center justify-center">
                <Trophy01 className="size-7 text-fg-brand-primary" />
              </div>
              <div>
                <p className="font-semibold text-primary">Invitez vos amis</p>
                <p className="text-sm text-tertiary mt-1">
                  Recevez <strong className="text-primary">{referrerBonus} {unit}</strong> par ami inscrit.
                </p>
              </div>
              <div className="rounded-lg bg-secondary/40 px-3 py-2 font-mono text-xs text-secondary truncate">
                {business.short_code
                  ? `izou.app/r/${business.short_code.toLowerCase()}-XXXXXX`
                  : 'izou.app/r/...'}
              </div>
              <Button color="primary" size="md" className="w-full" isDisabled>
                Partager mon lien
              </Button>
              <p className="text-[11px] text-tertiary">
                Aperçu de l&apos;écran que verront vos clients dans leur carte de fidélité.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Users01
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div className="rounded-xl bg-primary border border-secondary p-5">
      <div className="flex items-center gap-3">
        <div className={`size-10 rounded-lg flex items-center justify-center ${highlight ? 'bg-brand-secondary text-fg-brand-primary' : 'bg-secondary text-fg-secondary'}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs text-tertiary">{label}</p>
          <p className="text-display-xs font-semibold text-primary">{value}</p>
        </div>
      </div>
    </div>
  )
}
