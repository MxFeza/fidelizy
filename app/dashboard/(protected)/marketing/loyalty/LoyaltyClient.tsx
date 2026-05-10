'use client'

/**
 * Page Programme de fidelite (Story 5.3 — Figma G1).
 * Permet au commercant de configurer le coeur du programme :
 *   - Mode : tampons (carte a tampon) ou points (cumul)
 *   - Mode tampons : nombre de tampons + recompense
 *   - Mode points : points par euro depense
 *   - Templates par metier (suggestions de recompense)
 *   - Apercu live de la carte qui se met a jour en temps reel
 *
 * Persistance directe sur businesses (RLS limit a id = auth.uid()).
 */

import { useEffect, useMemo, useState } from 'react'
import { Gift01, Stars02, CheckDone01, Loading01, AlertCircle, Plus, Trash01 } from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import { Input } from '@/components/ui/base/input/input'
import { createClient } from '@/lib/supabase/client'
import LoyaltyCardVisual from '@/components/dashboard/LoyaltyCardVisual'
import { EmojiPicker } from '@/lib/emojis'
import type { Business, LoyaltyTier } from '@/lib/types'
import { cx } from '@/utils/cx'

function newTier(): LoyaltyTier {
  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    emoji: '🎁',
    name: '',
    threshold: 10,
  }
}

type LoyaltyType = 'stamps' | 'points'

interface LoyaltyClientProps {
  business: Business
}

const REWARD_SUGGESTIONS: Record<string, string[]> = {
  cafe: ['Boisson offerte', 'Café gratuit', 'Pâtisserie offerte', 'Boisson + pâtisserie'],
  restaurant: ['Dessert offert', 'Apéritif offert', 'Café offert', 'Plat du jour offert'],
  bakery: ['Pain offert', 'Viennoiserie offerte', 'Pâtisserie offerte', '−10% sur la prochaine commande'],
  snack: ['Menu offert', 'Boisson offerte', 'Frites offertes', 'Burger offert'],
  hair: ['Shampoing offert', 'Soin offert', '−15% sur la prochaine coupe', 'Brushing offert'],
  nails: ['Pose offerte', 'Dépose offerte', '−15% sur la prochaine pose', 'Soin des mains offert'],
  default: ['Un produit offert', '−10% sur la prochaine commande', 'Une boisson offerte'],
}

const STAMPS_PRESETS = [5, 8, 10, 12]

export default function LoyaltyClient({ business }: LoyaltyClientProps) {
  const [loyaltyType, setLoyaltyType] = useState<LoyaltyType>(
    (business.loyalty_type as LoyaltyType) ?? 'stamps',
  )
  const [stampsRequired, setStampsRequired] = useState<number>(business.stamps_required ?? 10)
  const [stampsReward, setStampsReward] = useState<string>(business.stamps_reward ?? 'Un produit offert')
  const [pointsPerEuro, setPointsPerEuro] = useState<number>(business.points_per_euro ?? 1)
  const [scanCooldownHours, setScanCooldownHours] = useState<number>(business.scan_cooldown_hours ?? 4)
  const [tiers, setTiers] = useState<LoyaltyTier[]>(business.reward_tiers ?? [])

  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const suggestions = useMemo(() => {
    const key = (business.business_type ?? 'default') as keyof typeof REWARD_SUGGESTIONS
    return REWARD_SUGGESTIONS[key] ?? REWARD_SUGGESTIONS.default
  }, [business.business_type])

  const isDirty = useMemo(() => (
    loyaltyType !== (business.loyalty_type ?? 'stamps') ||
    stampsRequired !== (business.stamps_required ?? 10) ||
    pointsPerEuro !== (business.points_per_euro ?? 1) ||
    scanCooldownHours !== (business.scan_cooldown_hours ?? 4) ||
    JSON.stringify(tiers) !== JSON.stringify(business.reward_tiers ?? [])
  ), [loyaltyType, stampsRequired, pointsPerEuro, scanCooldownHours, tiers, business])

  useEffect(() => {
    if (!savedAt) return
    const t = setTimeout(() => setSavedAt(null), 3000)
    return () => clearTimeout(t)
  }, [savedAt])

  // Bootstrap auto : si aucun palier mais une recompense legacy (stamps_reward), creer un palier initial
  // pour que le commercant ne voit pas un programme vide. Le commercant peut ensuite l'editer.
  useEffect(() => {
    if (tiers.length === 0 && business.stamps_reward && business.stamps_required) {
      setTiers([{
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        emoji: '🎁',
        name: business.stamps_reward,
        threshold: loyaltyType === 'stamps' ? business.stamps_required : 100,
      }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const validTiers = tiers.filter((t) => t.name.trim().length > 0 && t.threshold > 0)

      // Pour backward-compat avec /api/scan qui lit encore stamps_reward,
      // on derive la recompense principale = palier au seuil stamps_required (ou 1er palier).
      const principalTier = validTiers.find((t) => t.threshold === stampsRequired) ?? validTiers[0]
      const derivedStampsReward = principalTier?.name?.trim() || stampsReward.trim() || 'Un produit offert'

      const { error: dbError } = await supabase
        .from('businesses')
        .update({
          loyalty_type: loyaltyType,
          stamps_required: stampsRequired,
          stamps_reward: derivedStampsReward,
          points_per_euro: pointsPerEuro,
          scan_cooldown_hours: scanCooldownHours,
          reward_tiers: validTiers,
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
      {/* Header — title only ; save actions sont dans la save bar globale en bas */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-display-xs sm:text-display-sm font-semibold text-primary">
          Programme de fidélité
        </h1>
        <p className="text-sm sm:text-md text-tertiary mt-1">
          Configurez le fonctionnement de votre carte de fidélité.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form column */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Type de programme */}
          <section
            data-tour="loyalty-type"
            className="rounded-xl bg-primary border border-secondary p-5 sm:p-6"
          >
            <h2 className="text-lg font-semibold text-primary mb-1">Type de programme</h2>
            <p className="text-sm text-tertiary mb-5">
              Choisissez le système qui correspond à votre activité.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ModeCard
                icon={Gift01}
                title="Tampons"
                subtitle="1 visite = 1 tampon. Carte à tampons classique."
                selected={loyaltyType === 'stamps'}
                onClick={() => setLoyaltyType('stamps')}
              />
              <ModeCard
                icon={Stars02}
                title="Points"
                subtitle="X points par € dépensé. Cumul libre."
                selected={loyaltyType === 'points'}
                onClick={() => setLoyaltyType('points')}
              />
            </div>
          </section>

          {/* 2. Système de récompense — fusion mode-spec + paliers + délai anti-fraude */}
          <section
            data-tour="loyalty-tiers"
            className="rounded-xl bg-primary border border-secondary p-5 sm:p-6 space-y-6"
          >
            <div>
              <h2 className="text-lg font-semibold text-primary mb-1">
                {loyaltyType === 'stamps' ? 'Carte à tampons' : 'Système de points'}
              </h2>
              <p className="text-sm text-tertiary">
                {loyaltyType === 'stamps'
                  ? 'Définissez combien de tampons sont nécessaires pour la récompense principale, et ajoutez des paliers pour récompenser plus de fidélité.'
                  : 'Définissez combien de points par euro dépensé, et configurez les paliers de récompenses débloquables.'}
              </p>
            </div>

            {loyaltyType === 'stamps' ? (
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Nombre de tampons sur la carte
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {STAMPS_PRESETS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setStampsRequired(n)}
                      className={cx(
                        'px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors border',
                        stampsRequired === n
                          ? 'bg-brand-secondary text-fg-brand-primary border-brand'
                          : 'bg-primary text-secondary border-secondary hover:bg-primary_hover',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={String(stampsRequired)}
                  onChange={(v) => {
                    const n = parseInt(v, 10)
                    if (!isNaN(n) && n >= 1 && n <= 50) setStampsRequired(n)
                  }}
                  hint="Le total visible sur la carte. Les récompenses sont définies par paliers ci-dessous."
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Points par euro dépensé
                </label>
                <Input
                  type="number"
                  value={String(pointsPerEuro)}
                  onChange={(v) => {
                    const n = parseFloat(v)
                    if (!isNaN(n) && n > 0 && n <= 100) setPointsPerEuro(n)
                  }}
                  hint={`${pointsPerEuro} point${pointsPerEuro > 1 ? 's' : ''} par € dépensé. Les récompenses sont définies par paliers ci-dessous.`}
                />
              </div>
            )}

            {/* Paliers fusionnés — c'est ICI qu'on définit les récompenses */}
            <div className="border-t border-secondary pt-6">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-primary mb-1">
                  Paliers de récompenses
                </h3>
                <p className="text-xs text-tertiary">
                  {loyaltyType === 'stamps'
                    ? `Définissez ce que vos clients gagnent en accumulant des tampons. Configurez au moins un palier au seuil ${stampsRequired} (la récompense de la carte complète).`
                    : 'Définissez ce que vos clients peuvent obtenir avec leurs points.'}
                </p>
              </div>
              <TiersInline
                tiers={tiers}
                onChange={setTiers}
                unit={loyaltyType === 'points' ? 'pts' : 'tampons'}
                suggestions={suggestions}
                businessType={business.business_type}
              />
            </div>

            {/* Délai anti-fraude integré dans le bloc */}
            <div className="border-t border-secondary pt-6">
              <h3 className="text-sm font-semibold text-primary mb-1">Délai anti-fraude</h3>
              <p className="text-xs text-tertiary mb-3">
                Délai minimum entre deux scans pour le même client. Évite qu&apos;un client ne scanne plusieurs fois d&apos;affilée pour gagner des {loyaltyType === 'stamps' ? 'tampons' : 'points'} sans repasser à la caisse.
              </p>
              <Input
                type="number"
                value={String(scanCooldownHours)}
                onChange={(v) => {
                  const n = parseInt(v, 10)
                  if (!isNaN(n) && n >= 0 && n <= 72) setScanCooldownHours(n)
                }}
                hint={scanCooldownHours === 0 ? 'Aucun délai (scans illimités).' : `${scanCooldownHours} h entre deux scans pour le même client`}
              />
            </div>
          </section>
        </div>

        {/* Live preview column */}
        <aside className="lg:col-span-5 lg:sticky lg:top-6 self-start">
          <div className="rounded-xl bg-secondary/40 border border-secondary p-5 sm:p-6">
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wide mb-4">
              Aperçu temps réel
            </p>
            <LoyaltyCardVisual
              customerName="Marie-Anne"
              loyaltyType={loyaltyType}
              currentStamps={Math.min(7, stampsRequired)}
              stampsRequired={stampsRequired}
              currentPoints={loyaltyType === 'points' ? Math.round(20 * pointsPerEuro) : 0}
              businessLogoUrl={business.logo_url}
              cardImageUrl={business.card_image_url}
            />
            <div className="mt-5 rounded-lg bg-primary border border-secondary p-4">
              <p className="text-sm font-medium text-primary mb-2">
                {loyaltyType === 'stamps' ? 'Vos paliers' : 'Vos paliers'}
              </p>
              {tiers.filter((t) => t.name.trim()).length === 0 ? (
                <p className="text-sm text-tertiary">
                  Aucun palier configuré. Ajoutez-en au moins un pour offrir une récompense à vos clients.
                </p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {[...tiers]
                    .filter((t) => t.name.trim())
                    .sort((a, b) => a.threshold - b.threshold)
                    .map((t) => (
                      <li key={t.id} className="flex items-baseline gap-2 text-tertiary">
                        <span className="text-base shrink-0" aria-hidden="true">{t.emoji}</span>
                        <span>
                          <strong className="text-primary">{t.threshold} {loyaltyType === 'points' ? 'pts' : 'tampons'}</strong>
                          {' : '}
                          <span className="text-secondary">{t.name}</span>
                        </span>
                      </li>
                    ))}
                </ul>
              )}
              {loyaltyType === 'points' && (
                <p className="text-xs text-tertiary mt-3 pt-3 border-t border-secondary">
                  Cumul : {pointsPerEuro} point{pointsPerEuro > 1 ? 's' : ''} par € dépensé
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Save bar globale en bas (static, pas sticky — feedback user 2026-05-01 : la bar flottante mangeait l'ecran) */}
      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        {savedAt && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success-primary">
            <CheckDone01 className="size-4" />
            Modifications enregistrées
          </span>
        )}
        {error && (
          <span className="inline-flex items-center gap-1.5 text-sm text-error-primary">
            <AlertCircle className="size-4" />
            {error}
          </span>
        )}
        <Button
          data-tour="loyalty-save"
          color="primary"
          size="md"
          isDisabled={!isDirty || saving}
          iconLeading={saving ? Loading01 : undefined}
          onClick={handleSave}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </div>
  )
}

function ModeCard({
  icon: Icon,
  title,
  subtitle,
  selected,
  onClick,
}: {
  icon: typeof Gift01
  title: string
  subtitle: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        'text-left p-4 rounded-lg border transition-all',
        selected
          ? 'border-brand bg-brand-secondary/30 ring-2 ring-brand/30'
          : 'border-secondary bg-primary hover:bg-primary_hover',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cx(
            'size-10 rounded-lg flex items-center justify-center shrink-0',
            selected ? 'bg-brand-solid text-white' : 'bg-secondary text-fg-secondary',
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className={cx('font-semibold', selected ? 'text-fg-brand-primary' : 'text-primary')}>
            {title}
          </p>
          <p className="text-xs text-tertiary mt-0.5">{subtitle}</p>
        </div>
      </div>
    </button>
  )
}

function TiersInline({
  tiers,
  onChange,
  unit,
  suggestions,
  businessType,
}: {
  tiers: LoyaltyTier[]
  onChange: (tiers: LoyaltyTier[]) => void
  unit: 'pts' | 'tampons'
  suggestions: string[]
  businessType: Business['business_type']
}) {
  function update(id: string, patch: Partial<LoyaltyTier>) {
    onChange(tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }
  function remove(id: string) {
    onChange(tiers.filter((t) => t.id !== id))
  }
  function add() {
    onChange([...tiers, newTier()])
  }

  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold)

  return (
    <div className="space-y-3">
      {sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((tier, idx) => (
            <TierRow
              key={tier.id}
              tier={tier}
              unit={unit}
              suggestions={suggestions}
              isFirst={idx === 0}
              businessType={businessType}
              onUpdate={(patch) => update(tier.id, patch)}
              onRemove={() => remove(tier.id)}
            />
          ))}
        </div>
      )}

      <button
        data-tour="loyalty-add-tier"
        type="button"
        onClick={add}
        className="w-full rounded-lg border border-dashed border-secondary bg-primary hover:bg-secondary/30 text-secondary hover:text-primary py-4 px-4 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
      >
        <Plus className="size-5" />
        Ajouter un palier
      </button>
    </div>
  )
}

function TierRow({
  tier,
  unit,
  suggestions,
  isFirst,
  businessType,
  onUpdate,
  onRemove,
}: {
  tier: LoyaltyTier
  unit: 'pts' | 'tampons'
  suggestions: string[]
  isFirst: boolean
  businessType: Business['business_type']
  onUpdate: (patch: Partial<LoyaltyTier>) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-lg border border-secondary bg-primary p-4 hover:bg-secondary/10 transition-colors">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Emoji — picker catalogue Izou (Microsoft Fluent Emoji) */}
        <EmojiPicker
          value={tier.emoji}
          onChange={(unicode) => onUpdate({ emoji: unicode })}
          businessType={businessType}
          triggerSize="lg"
        />

        {/* Champs : nom au-dessus, seuil en dessous */}
        <div className="flex-1 min-w-0 space-y-2">
          <input
            type="text"
            value={tier.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder={isFirst && suggestions[0] ? suggestions[0] : 'Nom du palier (ex : Café offert)'}
            className="w-full text-base sm:text-lg font-semibold text-primary bg-transparent border-0 outline-none focus:ring-0 placeholder:text-quaternary placeholder:font-normal px-0"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={String(tier.threshold)}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10)
                if (!isNaN(n) && n >= 1 && n <= 9999) onUpdate({ threshold: n })
              }}
              className="w-16 sm:w-20 px-2 py-1 rounded-md bg-secondary/40 border border-secondary text-sm text-primary text-center focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <span className="text-sm text-tertiary">{unit}</span>
          </div>
        </div>

        {/* Trash */}
        <button
          type="button"
          onClick={onRemove}
          aria-label="Supprimer ce palier"
          className="size-9 shrink-0 inline-flex items-center justify-center rounded-md text-tertiary hover:text-error-primary hover:bg-error-secondary/40 transition-colors"
        >
          <Trash01 className="size-4" />
        </button>
      </div>
    </div>
  )
}
