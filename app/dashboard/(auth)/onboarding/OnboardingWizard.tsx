'use client'

/**
 * Refonte onboarding merchant 5 etapes (2026-05-15) — brief
 * project_izou_onboarding_brief_2026-05-14.md.
 *
 * Flow : Intro → Metier → Carte → Paliers → Apercu.
 *
 * - State global ici, persistance progressive en DB a chaque etape (le user
 *   peut quitter et revenir sans perdre ses uploads / choix metier — il
 *   recommence l'intro mais ses donnees sont toujours la).
 * - Stepper visible en haut (sauf etape 1 plein-ecran).
 * - Apercu live carte des etape 2 : sticky droite desktop, modal sheet mobile.
 * - Pas de personnalisation couleur (DA Izou uniforme — feedback_da_izou_uniforme).
 * - Reuse maximal : LoyaltyCardVisual, AssetUploader, EmojiPicker,
 *   NumberFieldDraft, ConfettiEffect, ShareCardModal.
 */

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Eye, X as XIcon, CreditCard02, BarChartSquareUp, Bell01,
  Heart, Star01, Sun, Lightning01, Scissors01, Stars02,
  CheckCircle, Plus, Trash01, Gift01, Share04,
} from '@untitledui/icons'
import type { FC, HTMLAttributes } from 'react'
import { Button } from '@/components/ui/base/buttons/button'
import { createClient } from '@/lib/supabase/client'
import { cx } from '@/utils/cx'
import { PUBLIC_ASSETS } from '@/lib/assets'
import LoyaltyCardVisual from '@/components/dashboard/LoyaltyCardVisual'
import { AssetUploader } from '@/components/dashboard/AssetUploader'
import NumberFieldDraft from '@/components/ui/NumberFieldDraft'
import { EmojiPicker } from '@/lib/emojis'
import ConfettiEffect from '@/app/card/[cardId]/components/ConfettiEffect'
import ShareCardModal from '@/components/dashboard/ShareCardModal'
import type { Business, BusinessType, LoyaltyTier } from '@/lib/types'

// ── Constants ─────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5

const STEPS: Array<{ id: Step; label: string }> = [
  { id: 1, label: 'Intro' },
  { id: 2, label: 'Métier' },
  { id: 3, label: 'Carte' },
  { id: 4, label: 'Paliers' },
  { id: 5, label: 'Aperçu' },
]

interface TypeOption {
  id: BusinessType
  icon: FC<HTMLAttributes<HTMLOrSVGElement>>
  title: string
  subtitle: string
  defaultReward: string
}

const BUSINESS_TYPES: TypeOption[] = [
  { id: 'cafe', icon: Heart, title: 'Café', subtitle: 'Coffee shop, salon de thé, bar à jus…', defaultReward: 'Boisson offerte' },
  { id: 'restaurant', icon: Star01, title: 'Restaurant', subtitle: 'Restaurant, brasserie, pizzeria, traiteur…', defaultReward: 'Dessert offert' },
  { id: 'bakery', icon: Sun, title: 'Boulangerie', subtitle: 'Boulangerie, pâtisserie, viennoiserie…', defaultReward: 'Pain offert' },
  { id: 'snack', icon: Lightning01, title: 'Snack & Fast-food', subtitle: 'Burger, tacos, kebab, poké bowl…', defaultReward: 'Menu offert' },
  { id: 'hair', icon: Scissors01, title: 'Coiffure', subtitle: 'Salon de coiffure, barbier…', defaultReward: 'Shampoing offert' },
  { id: 'nails', icon: Stars02, title: 'Onglerie & Beauté', subtitle: 'Prothésiste ongulaire, esthétique, soins…', defaultReward: 'Pose offerte' },
]

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
const MAX_TIERS = 3

// ── Props ─────────────────────────────────────────────────────────────────

interface OnboardingWizardProps {
  initialBusiness: Business
}

// ── Helpers ───────────────────────────────────────────────────────────────

function newTier(threshold: number): LoyaltyTier {
  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
    emoji: '🎁',
    name: '',
    threshold,
  }
}

// ── Composant principal ───────────────────────────────────────────────────

export default function OnboardingWizard({ initialBusiness }: OnboardingWizardProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  // Si tout est deja configure (rare en pratique), on continue quand meme depuis 1 pour
  // garantir la coherence pedagogique (cf. brief : "redirect a l'etape 1").
  const [step, setStep] = useState<Step>(1)
  const [businessType, setBusinessType] = useState<BusinessType | null>(initialBusiness.business_type)
  const [businessName] = useState(initialBusiness.business_name)
  const [firstName] = useState<string>(
    initialBusiness.first_name?.trim() || initialBusiness.business_name?.split(/\s+/)[0] || 'Toi',
  )

  const [logoUrl, setLogoUrl] = useState<string | null>(initialBusiness.logo_url)
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(initialBusiness.card_image_url)
  const [stampsRequired, setStampsRequired] = useState<number>(initialBusiness.stamps_required ?? 10)

  // Paliers : si reward_tiers existe et non-vide, partir de la. Sinon
  // initialiser avec 1 palier au seuil = stampsRequired des qu'on arrive
  // a l'etape 4 (cf. ensureMinimumTier plus bas).
  const [tiers, setTiers] = useState<LoyaltyTier[]>(initialBusiness.reward_tiers ?? [])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreviewMobile, setShowPreviewMobile] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const businessShortCode = initialBusiness.short_code
  const businessId = initialBusiness.id

  // Suggestions selon metier (defaut si pas encore choisi)
  const rewardSuggestions = useMemo(() => {
    const key = (businessType ?? 'default') as keyof typeof REWARD_SUGGESTIONS
    return REWARD_SUGGESTIONS[key] ?? REWARD_SUGGESTIONS.default
  }, [businessType])

  // ── Persistance par etape ──────────────────────────────────────────────

  async function persistBusinessType(type: BusinessType) {
    setSaving(true)
    setError(null)
    try {
      const option = BUSINESS_TYPES.find((o) => o.id === type)!
      const { error: dbError } = await supabase
        .from('businesses')
        .update({
          business_type: option.id,
          // Mise a jour de la recompense par defaut si pas encore touchee par le user
          stamps_reward: initialBusiness.stamps_reward || option.defaultReward,
        })
        .eq('id', businessId)
      if (dbError) throw dbError
      setBusinessType(type)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de sauvegarder.')
      throw e
    } finally {
      setSaving(false)
    }
  }

  async function persistCardConfig() {
    setSaving(true)
    setError(null)
    try {
      const { error: dbError } = await supabase
        .from('businesses')
        .update({
          stamps_required: stampsRequired,
          // logo_url et card_image_url deja persistes via AssetUploader
        })
        .eq('id', businessId)
      if (dbError) throw dbError
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de sauvegarder.')
      throw e
    } finally {
      setSaving(false)
    }
  }

  async function persistTiers() {
    setSaving(true)
    setError(null)
    try {
      const validTiers = tiers
        .filter((t) => t.name.trim().length > 0 && t.threshold > 0)
        .sort((a, b) => a.threshold - b.threshold)

      // Derive stamps_reward = nom du palier au seuil stampsRequired (compatibilite scan).
      const principal = validTiers.find((t) => t.threshold === stampsRequired) ?? validTiers[0]
      const stampsReward = principal?.name?.trim() || 'Un produit offert'

      const { error: dbError } = await supabase
        .from('businesses')
        .update({
          reward_tiers: validTiers,
          stamps_reward: stampsReward,
        })
        .eq('id', businessId)
      if (dbError) throw dbError
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de sauvegarder.')
      throw e
    } finally {
      setSaving(false)
    }
  }

  async function completeOnboarding() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/business/onboarding/complete', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || 'Impossible de finaliser.')
      }
      // Marque la tour post-onboarding a relancer au prochain dashboard load.
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('izou.post-onboarding-tour', '1')
      }
      router.push('/dashboard?tour=welcome')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de finaliser.')
      setSaving(false)
    }
  }

  // ── Navigation ─────────────────────────────────────────────────────────

  async function goNext() {
    setError(null)
    try {
      if (step === 1) {
        setStep(2)
      } else if (step === 2) {
        if (!businessType) {
          setError('Choisissez votre type de commerce pour continuer.')
          return
        }
        await persistBusinessType(businessType)
        setStep(3)
      } else if (step === 3) {
        await persistCardConfig()
        // Bootstrap 1er palier au seuil stamps_required si tiers vide
        if (tiers.filter((t) => t.name.trim()).length === 0) {
          const option = BUSINESS_TYPES.find((o) => o.id === businessType)
          const defaultRewardName = option?.defaultReward || 'Un produit offert'
          setTiers([{
            id: newTier(stampsRequired).id,
            emoji: '🎁',
            name: defaultRewardName,
            threshold: stampsRequired,
          }])
        } else {
          // Re-aligne le palier principal sur stamps_required si seuil identique
          // a l'ancien stamps_required configure precedemment.
          setTiers((prev) => prev.map((t, i) => i === 0 ? { ...t, threshold: stampsRequired } : t))
        }
        setStep(4)
      } else if (step === 4) {
        // Validation : au moins 1 palier avec nom + seuil = stampsRequired
        const valid = tiers.filter((t) => t.name.trim().length > 0)
        if (valid.length === 0) {
          setError('Ajoutez au moins une récompense pour continuer.')
          return
        }
        const hasPrincipal = valid.some((t) => t.threshold === stampsRequired)
        if (!hasPrincipal) {
          setError(`Configurez au moins une récompense au seuil ${stampsRequired} tampons (la carte complète).`)
          return
        }
        await persistTiers()
        setStep(5)
        // Confettis au mount de l'etape 5
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3500)
      } else if (step === 5) {
        await completeOnboarding()
      }
    } catch {
      // setError deja gere par persist*
    }
  }

  function goBack() {
    setError(null)
    if (step > 1) setStep((step - 1) as Step)
  }

  // ── Sous-composants par etape ──────────────────────────────────────────

  function renderStep1Intro() {
    return (
      <Step1Intro
        firstName={firstName}
        onContinue={goNext}
        onSkip={async () => {
          // Skip = aller directement a l'etape 2 (Metier)
          setStep(2)
        }}
      />
    )
  }

  function renderStep2BusinessType() {
    return (
      <Step2BusinessType
        firstName={firstName}
        selected={businessType}
        onSelect={setBusinessType}
      />
    )
  }

  function renderStep3Card() {
    return (
      <Step3Card
        businessType={businessType}
        logoUrl={logoUrl}
        cardImageUrl={cardImageUrl}
        stampsRequired={stampsRequired}
        onLogoChange={setLogoUrl}
        onCardImageChange={setCardImageUrl}
        onStampsChange={setStampsRequired}
      />
    )
  }

  function renderStep4Tiers() {
    return (
      <Step4Tiers
        businessType={businessType}
        stampsRequired={stampsRequired}
        tiers={tiers}
        onTiersChange={setTiers}
        suggestions={rewardSuggestions}
      />
    )
  }

  function renderStep5Preview() {
    return (
      <Step5Preview
        firstName={firstName}
        businessName={businessName}
        logoUrl={logoUrl}
        cardImageUrl={cardImageUrl}
        stampsRequired={stampsRequired}
        tiers={tiers}
        onShareClick={() => setShowShareModal(true)}
        onDashboardClick={completeOnboarding}
        saving={saving}
      />
    )
  }

  // ── Apercu live (steps 2-5) ────────────────────────────────────────────

  const showPreviewPanel = step >= 2 && step < 5
  const previewCard = (
    <LoyaltyCardVisual
      customerName="Marie-Anne"
      loyaltyType="stamps"
      currentStamps={Math.min(3, stampsRequired)}
      stampsRequired={stampsRequired}
      businessName={businessName}
      businessLogoUrl={logoUrl}
      cardImageUrl={cardImageUrl}
      withGradientBackground={false}
    />
  )

  // ── Render ─────────────────────────────────────────────────────────────

  // Etape 1 : layout plein-ecran sans stepper visible (intro skippable).
  if (step === 1) {
    return (
      <div className="min-h-screen bg-primary flex flex-col">
        <header className="px-6 pt-6 lg:px-10 lg:pt-8">
          <Image
            src={PUBLIC_ASSETS.branding.logoNoir}
            alt="Izou"
            width={139}
            height={32}
            className="h-8 w-auto"
            priority
            unoptimized
          />
        </header>
        <main className="flex-1 flex items-center justify-center px-6 py-10 lg:px-10">
          <div className="w-full max-w-5xl">{renderStep1Intro()}</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* Header avec logo + stepper */}
      <header className="border-b border-secondary bg-primary sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-3 sm:py-4 flex items-center gap-4 sm:gap-8">
          <Image
            src={PUBLIC_ASSETS.branding.logoNoir}
            alt="Izou"
            width={120}
            height={28}
            className="h-6 sm:h-7 w-auto shrink-0"
            priority
            unoptimized
          />
          <Stepper currentStep={step} />
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 gap-6 lg:gap-10">
        {/* Colonne contenu */}
        <section className={cx(
          'flex-1 min-w-0',
          showPreviewPanel ? 'lg:max-w-2xl' : 'max-w-3xl mx-auto w-full',
        )}>
          {step === 2 && renderStep2BusinessType()}
          {step === 3 && renderStep3Card()}
          {step === 4 && renderStep4Tiers()}
          {step === 5 && renderStep5Preview()}
        </section>

        {/* Colonne apercu (desktop steps 2-4) */}
        {showPreviewPanel && (
          <aside className="hidden lg:block lg:w-[360px] lg:sticky lg:top-24 self-start shrink-0">
            <div className="rounded-2xl bg-secondary/40 border border-secondary p-5">
              <p className="text-xs font-semibold text-tertiary uppercase tracking-wide mb-4">
                Aperçu temps réel
              </p>
              {previewCard}
            </div>
          </aside>
        )}
      </main>

      {/* Footer CTA bar (sauf step 5 — gere son propre CTA) */}
      {step !== 5 && (
        <footer className="border-t border-secondary bg-primary sticky bottom-0 z-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                size="md"
                color="tertiary"
                iconLeading={ArrowLeft}
                onClick={goBack}
                isDisabled={step <= 2 || saving}
              >
                Retour
              </Button>
              {showPreviewPanel && (
                <Button
                  size="md"
                  color="tertiary"
                  iconLeading={Eye}
                  onClick={() => setShowPreviewMobile(true)}
                  className="lg:hidden"
                >
                  Aperçu
                </Button>
              )}
            </div>

            {error && (
              <p className="text-sm text-error-primary order-3 w-full sm:w-auto sm:order-2 truncate max-w-full">
                {error}
              </p>
            )}

            <Button
              size="md"
              color="primary"
              iconTrailing={ArrowRight}
              onClick={goNext}
              isDisabled={saving}
              className="order-2 sm:order-3"
            >
              {saving ? 'Enregistrement…' : 'Continuer'}
            </Button>
          </div>
        </footer>
      )}

      {/* Modal apercu mobile */}
      {showPreviewMobile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu de votre carte"
          className="fixed inset-0 z-50 lg:hidden flex items-end bg-overlay/70 backdrop-blur-sm"
          onClick={() => setShowPreviewMobile(false)}
        >
          <div
            className="w-full bg-primary rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-primary">Aperçu de votre carte</p>
              <button
                type="button"
                onClick={() => setShowPreviewMobile(false)}
                aria-label="Fermer"
                className="size-8 rounded-full flex items-center justify-center text-tertiary hover:bg-secondary"
              >
                <XIcon className="size-5" />
              </button>
            </div>
            {previewCard}
          </div>
        </div>
      )}

      {/* Confettis etape 5 */}
      {showConfetti && <ConfettiEffect color="#7F56D9" />}

      {/* Modal partage etape 5 */}
      <ShareCardModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        businessName={businessName}
        shortCode={businessShortCode}
        businessId={businessId}
      />
    </div>
  )
}

// ── Stepper ──────────────────────────────────────────────────────────────

function Stepper({ currentStep }: { currentStep: Step }) {
  return (
    <ol className="flex-1 flex items-center justify-between gap-1 sm:gap-2">
      {STEPS.map((s, i) => {
        const isActive = s.id === currentStep
        const isDone = s.id < currentStep
        return (
          <li key={s.id} className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div
                className={cx(
                  'size-6 sm:size-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold shrink-0 transition-colors',
                  isDone && 'bg-success-solid text-white',
                  isActive && 'bg-brand-solid text-white',
                  !isDone && !isActive && 'bg-secondary text-tertiary',
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {isDone ? <CheckCircle className="size-4" /> : s.id}
              </div>
              <span
                className={cx(
                  'text-[11px] sm:text-xs font-medium truncate',
                  isActive && 'text-primary',
                  isDone && 'text-tertiary',
                  !isActive && !isDone && 'text-quaternary',
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cx(
                  'flex-1 h-[2px] rounded-full hidden sm:block',
                  isDone ? 'bg-success-solid' : 'bg-secondary',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

// ── Etape 1 : Intro pedagogique ──────────────────────────────────────────

function Step1Intro({
  firstName,
  onContinue,
  onSkip,
}: {
  firstName: string
  onContinue: () => void
  onSkip: () => void
}) {
  const cards = [
    {
      icon: CreditCard02,
      title: 'Fini la carte papier perdue',
      body: 'Tes clients gardent leur carte dans Apple Wallet, plus jamais oubliée.',
    },
    {
      icon: BarChartSquareUp,
      title: 'Aperçu temps réel',
      body: 'Vois qui revient, ton top 3 clients, ton activité du jour.',
    },
    {
      icon: Bell01,
      title: 'Push notifs automatiques',
      body: 'Tes clients reçoivent une notif quand ils débloquent une récompense.',
    },
  ]
  return (
    <div className="space-y-10">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h1 className="text-display-md sm:text-display-lg font-semibold text-primary tracking-tight">
          Bienvenue {firstName} 🎉
        </h1>
        <p className="text-md sm:text-lg text-tertiary">
          La fidélité digitale qui transforme tes clients en habitués.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div
              key={c.title}
              className="rounded-2xl border border-secondary bg-secondary/30 p-5 sm:p-6 flex flex-col gap-4"
            >
              <div className="size-12 rounded-xl bg-brand-secondary flex items-center justify-center shrink-0">
                <Icon className="size-6 text-fg-brand-primary" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-md sm:text-lg font-semibold text-primary leading-tight">
                  {c.title}
                </h3>
                <p className="text-sm text-tertiary">{c.body}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button size="lg" color="primary" iconTrailing={ArrowRight} onClick={onContinue} className="w-full sm:w-auto">
          Commencer
        </Button>
        <Button size="lg" color="tertiary" onClick={onSkip} className="w-full sm:w-auto">
          Passer l&apos;intro
        </Button>
      </div>
    </div>
  )
}

// ── Etape 2 : Choix metier ───────────────────────────────────────────────

function Step2BusinessType({
  firstName,
  selected,
  onSelect,
}: {
  firstName: string
  selected: BusinessType | null
  onSelect: (type: BusinessType) => void
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-display-sm sm:text-display-md font-semibold text-primary tracking-tight">
          C&apos;est parti {firstName} ! Quel est ton commerce ?
        </h2>
        <p className="text-md text-tertiary">
          Ton choix nous permet de pré-configurer ton programme avec les bonnes récompenses suggérées.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BUSINESS_TYPES.map((option) => {
          const isActive = selected === option.id
          const Icon = option.icon
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={cx(
                'w-full flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                isActive
                  ? 'border-brand bg-brand-secondary/40 ring-2 ring-brand/30'
                  : 'border-secondary bg-primary hover:bg-primary_hover',
              )}
            >
              <div className="shrink-0 flex items-center justify-center size-10 rounded-full bg-brand-primary">
                <Icon className="size-5 text-fg-brand-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cx('text-sm font-semibold', isActive ? 'text-fg-brand-primary' : 'text-primary')}>
                  {option.title}
                </p>
                <p className={cx('text-sm mt-0.5', isActive ? 'text-fg-brand-primary' : 'text-tertiary')}>
                  {option.subtitle}
                </p>
              </div>
              <div className={cx(
                'shrink-0 flex items-center justify-center size-5 rounded-full border-2 transition-colors mt-1',
                isActive ? 'bg-brand-solid border-brand-solid' : 'border-secondary bg-primary',
              )}>
                {isActive && (
                  <svg className="size-3 text-white" viewBox="0 0 14 14" fill="none">
                    <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Etape 3 : Config carte ───────────────────────────────────────────────

function Step3Card({
  businessType,
  logoUrl,
  cardImageUrl,
  stampsRequired,
  onLogoChange,
  onCardImageChange,
  onStampsChange,
}: {
  businessType: BusinessType | null
  logoUrl: string | null
  cardImageUrl: string | null
  stampsRequired: number
  onLogoChange: (url: string | null) => void
  onCardImageChange: (url: string | null) => void
  onStampsChange: (n: number) => void
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-display-sm sm:text-display-md font-semibold text-primary tracking-tight">
          Configure ta carte
        </h2>
        <p className="text-md text-tertiary">
          Ces trois éléments donnent à ta carte son identité visuelle. Tu pourras tout modifier plus tard.
        </p>
      </div>

      <section className="space-y-3">
        <div>
          <h3 className="text-md font-semibold text-primary">1. Logo de ton commerce</h3>
          <p className="text-sm text-tertiary mt-0.5">
            Affiché en bas à droite de la carte. PNG ou SVG avec fond transparent recommandé.
          </p>
        </div>
        <AssetUploader
          kind="logo"
          currentUrl={logoUrl}
          onUploaded={onLogoChange}
          onDeleted={() => onLogoChange(null)}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-md font-semibold text-primary">2. Image bandeau de la carte</h3>
          <p className="text-sm text-tertiary mt-0.5">
            Une photo de ton commerce ou produit phare — apparaît en haut de la carte.
          </p>
        </div>
        <AssetUploader
          kind="card"
          currentUrl={cardImageUrl}
          onUploaded={onCardImageChange}
          onDeleted={() => onCardImageChange(null)}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-md font-semibold text-primary">3. Nombre de tampons pour la récompense</h3>
          <p className="text-sm text-tertiary mt-0.5">
            Combien de visites avant que ton client ne reçoive sa récompense ? Tu pourras ajouter des paliers intermédiaires juste après.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STAMPS_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onStampsChange(n)}
              className={cx(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors border',
                stampsRequired === n
                  ? 'bg-brand-secondary text-fg-brand-primary border-brand'
                  : 'bg-primary text-secondary border-secondary hover:bg-primary_hover',
              )}
            >
              {n} tampons
            </button>
          ))}
        </div>
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-secondary mb-1.5">
            Ou saisis un nombre personnalisé
          </label>
          <NumberFieldDraft
            value={stampsRequired}
            onChange={onStampsChange}
            min={3}
            max={30}
            inputProps={{
              className: 'w-full px-3.5 py-2.5 rounded-lg ring-1 ring-secondary bg-primary text-md text-primary text-center focus:outline-2 focus:outline-brand',
              'aria-label': 'Nombre de tampons',
            }}
          />
          <p className="text-xs text-tertiary mt-1">Entre 3 et 30 tampons.</p>
        </div>
        {/* Note dependant du metier pour donner du contexte */}
        {businessType && (
          <p className="text-xs text-tertiary italic">
            La récompense par défaut suggérée pour ton métier : « {BUSINESS_TYPES.find((o) => o.id === businessType)?.defaultReward} ».
          </p>
        )}
      </section>
    </div>
  )
}

// ── Etape 4 : Paliers de recompenses ─────────────────────────────────────

function Step4Tiers({
  businessType,
  stampsRequired,
  tiers,
  onTiersChange,
  suggestions,
}: {
  businessType: BusinessType | null
  stampsRequired: number
  tiers: LoyaltyTier[]
  onTiersChange: (next: LoyaltyTier[]) => void
  suggestions: string[]
}) {
  // S'assure qu'il y a toujours au moins 1 palier au seuil stampsRequired
  // (et que ce palier reste forcement le dernier). Si l'utilisateur supprime
  // le palier principal, on le recree avec la valeur par defaut.
  useEffect(() => {
    if (tiers.length === 0) {
      const option = BUSINESS_TYPES.find((o) => o.id === businessType)
      const defaultName = option?.defaultReward || suggestions[0] || 'Récompense offerte'
      onTiersChange([{
        id: newTier(stampsRequired).id,
        emoji: '🎁',
        name: defaultName,
        threshold: stampsRequired,
      }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold)
  const canAddTier = tiers.length < MAX_TIERS

  function update(id: string, patch: Partial<LoyaltyTier>) {
    onTiersChange(tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  function remove(id: string) {
    onTiersChange(tiers.filter((t) => t.id !== id))
  }

  function add() {
    if (!canAddTier) return
    // Nouveau palier intermediaire : seuil = milieu entre le plus petit et stampsRequired,
    // si pas dispo, prend la moitie de stampsRequired.
    const existingThresholds = tiers.map((t) => t.threshold)
    const minExisting = Math.min(...existingThresholds, stampsRequired)
    const suggested = Math.max(1, Math.floor(minExisting / 2))
    onTiersChange([
      ...tiers,
      { id: newTier(suggested).id, emoji: '⭐', name: '', threshold: suggested },
    ])
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-display-sm sm:text-display-md font-semibold text-primary tracking-tight">
          Tes récompenses
        </h2>
        <p className="text-md text-tertiary">
          La carte se complète à {stampsRequired} tampons. Ajoute jusqu&apos;à 2 paliers intermédiaires pour récompenser tes clients plus souvent. ✨
        </p>
      </div>

      <div className="space-y-3">
        {sorted.map((tier) => {
          const isPrincipal = tier.threshold === stampsRequired
          return (
            <div
              key={tier.id}
              className={cx(
                'rounded-xl border p-4 transition-colors',
                isPrincipal
                  ? 'border-brand bg-brand-secondary/20'
                  : 'border-secondary bg-primary',
              )}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <EmojiPicker
                  value={tier.emoji}
                  onChange={(unicode) => update(tier.id, { emoji: unicode })}
                  businessType={businessType ?? undefined}
                  triggerSize="lg"
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) => update(tier.id, { name: e.target.value })}
                    placeholder={isPrincipal ? (suggestions[0] || 'Récompense principale') : 'Ex : Boisson offerte'}
                    className="w-full text-base sm:text-lg font-semibold text-primary bg-transparent border-0 outline-none focus:ring-0 placeholder:text-quaternary placeholder:font-normal px-0"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    {isPrincipal ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-secondary">
                        <Gift01 className="size-3.5" />
                        Récompense principale — {stampsRequired} tampons
                      </span>
                    ) : (
                      <>
                        <NumberFieldDraft
                          value={tier.threshold}
                          onChange={(n) => update(tier.id, { threshold: n })}
                          min={1}
                          max={stampsRequired - 1}
                          inputProps={{
                            className: 'w-16 sm:w-20 px-2 py-1 rounded-md bg-secondary/40 border border-secondary text-sm text-primary text-center focus:outline-none focus:ring-2 focus:ring-brand',
                            'aria-label': 'Seuil de tampons',
                          }}
                        />
                        <span className="text-sm text-tertiary">tampons</span>
                      </>
                    )}
                  </div>
                  {!isPrincipal && (
                    <p className="text-xs text-tertiary">
                      Suggestions :{' '}
                      {suggestions.slice(0, 3).map((s, i) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => update(tier.id, { name: s })}
                          className="font-medium text-brand-secondary hover:underline"
                        >
                          {s}{i < Math.min(2, suggestions.length - 1) ? ', ' : ''}
                        </button>
                      ))}
                    </p>
                  )}
                </div>
                {!isPrincipal && (
                  <button
                    type="button"
                    onClick={() => remove(tier.id)}
                    aria-label="Supprimer ce palier"
                    className="size-9 shrink-0 inline-flex items-center justify-center rounded-md text-tertiary hover:text-error-primary hover:bg-error-secondary/40 transition-colors"
                  >
                    <Trash01 className="size-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {canAddTier && (
          <button
            type="button"
            onClick={add}
            className="w-full rounded-xl border border-dashed border-secondary bg-primary hover:bg-secondary/30 text-secondary hover:text-primary py-4 px-4 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Plus className="size-5" />
            Ajouter un palier intermédiaire ({tiers.length}/{MAX_TIERS})
          </button>
        )}
      </div>

      <p className="text-sm text-tertiary">
        Plus que 1 étape avant de fidéliser tes premiers clients 🎯
      </p>
    </div>
  )
}

// ── Etape 5 : Apercu final ───────────────────────────────────────────────

function Step5Preview({
  firstName,
  businessName,
  logoUrl,
  cardImageUrl,
  stampsRequired,
  tiers,
  onShareClick,
  onDashboardClick,
  saving,
}: {
  firstName: string
  businessName: string
  logoUrl: string | null
  cardImageUrl: string | null
  stampsRequired: number
  tiers: LoyaltyTier[]
  onShareClick: () => void
  onDashboardClick: () => void
  saving: boolean
}) {
  const sortedTiers = [...tiers]
    .filter((t) => t.name.trim())
    .sort((a, b) => a.threshold - b.threshold)

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 py-4">
      <div className="text-center space-y-3">
        <h2 className="text-display-md sm:text-display-lg font-semibold text-primary tracking-tight">
          Bien joué {firstName} ! ✨
        </h2>
        <p className="text-md sm:text-lg text-tertiary">
          Ton programme de fidélité est prêt. Partage-le pour accueillir ton premier client.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="rounded-2xl bg-secondary/40 border border-secondary p-5 sm:p-6">
          <LoyaltyCardVisual
            customerName="Marie-Anne"
            loyaltyType="stamps"
            currentStamps={Math.min(3, stampsRequired)}
            stampsRequired={stampsRequired}
            businessName={businessName}
            businessLogoUrl={logoUrl}
            cardImageUrl={cardImageUrl}
            withGradientBackground={false}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-primary border border-secondary p-4 sm:p-5">
            <p className="text-sm font-semibold text-primary mb-3">Tes paliers de récompenses</p>
            {sortedTiers.length === 0 ? (
              <p className="text-sm text-tertiary">Aucun palier configuré.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {sortedTiers.map((t) => (
                  <li key={t.id} className="flex items-baseline gap-2">
                    <span className="text-base shrink-0" aria-hidden="true">{t.emoji}</span>
                    <span>
                      <strong className="text-primary">{t.threshold} tampons</strong>
                      {' : '}
                      <span className="text-tertiary">{t.name}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3">
            <Button
              size="lg"
              color="primary"
              iconLeading={Share04}
              onClick={onShareClick}
              className="w-full"
            >
              Partager mon programme
            </Button>
            <Button
              size="lg"
              color="secondary"
              onClick={onDashboardClick}
              isDisabled={saving}
              className="w-full"
            >
              {saving ? 'Finalisation…' : 'Accéder à mon dashboard'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
