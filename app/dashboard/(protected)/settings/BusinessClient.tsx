'use client'

/**
 * Mon entreprise (Story 8.1) — implementation conforme Figma G1b (10241:586).
 *
 * Page header : banniere paysage + avatar logo (chevauche), titre + adresse,
 * actions "Partager" (copie lien d'inscription) et "Voir fiche" (GMB).
 *
 * Trois sections, layout 2-col (sidebar 280px desktop / pleine largeur mobile) :
 *  1. Infos personnelles : prenom + nom + email
 *  2. Mon entreprise : nom commerce + activite + adresse + logo upload
 *  3. Details du commerce : toggle GMB + telephone + lien GMB + description
 *     + horaires + apercu Google Maps
 *
 * Le ratio uploade pour le logo est PRESERVE partout (sidebar, cartes loyalty,
 * Apple Wallet) via object-contain.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Building07, Camera01, MarkerPin01, Phone, Clock, Share04, ArrowUpRight,
  Copy01, CheckDone01, AlertCircle, Globe01, User01,
} from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import { Input } from '@/components/ui/base/input/input'
import { Toggle } from '@/components/ui/base/toggle/toggle'
import { AssetUploader } from '@/components/dashboard/AssetUploader'
import { createClient } from '@/lib/supabase/client'
import type { Business, BusinessType } from '@/lib/types'
import { cx } from '@/utils/cx'

interface BusinessClientProps {
  business: Business
  email: string
}

const ACTIVITIES: { value: BusinessType; label: string }[] = [
  { value: 'cafe', label: 'Café' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'bakery', label: 'Boulangerie' },
  { value: 'snack', label: 'Snack' },
  { value: 'hair', label: 'Coiffeur' },
  { value: 'nails', label: 'Onglerie' },
]

const HOUR_PRESETS = [
  'Lun-Ven : 9h-18h',
  'Lun-Sam : 8h-19h',
  'Mar-Sam : 10h-19h',
  'Tous les jours : 7h-22h',
]

const MAX_DESC = 280

export default function BusinessClient({ business, email }: BusinessClientProps) {
  const router = useRouter()
  const supabase = createClient()

  // Avatar/Identité
  const [logoUrl, setLogoUrl] = useState<string | null>(business.logo_url)
  const [bannerUrl, setBannerUrl] = useState<string | null>(business.banner_url)

  // Infos personnelles
  const [firstName, setFirstName] = useState(business.first_name ?? '')
  const [lastName, setLastName] = useState(business.last_name ?? '')

  // Mon entreprise
  const [businessName, setBusinessName] = useState(business.business_name)
  const [businessType, setBusinessType] = useState<BusinessType | null>(business.business_type)
  const [address, setAddress] = useState(business.address ?? '')

  // Details du commerce
  const [gmbVisible, setGmbVisible] = useState(business.gmb_visible)
  const [phone, setPhone] = useState(business.phone ?? '')
  const [gmbUrl, setGmbUrl] = useState(business.gmb_url ?? '')
  const [description, setDescription] = useState(business.description ?? '')
  const [openingHours, setOpeningHours] = useState(business.opening_hours ?? '')

  const [savingSection, setSavingSection] = useState<'personal' | 'business' | 'details' | null>(null)
  const [savedSection, setSavedSection] = useState<'personal' | 'business' | 'details' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)

  useEffect(() => {
    if (!savedSection) return
    const t = setTimeout(() => setSavedSection(null), 2500)
    return () => clearTimeout(t)
  }, [savedSection])

  const dirtyPersonal = useMemo(() => (
    firstName !== (business.first_name ?? '') ||
    lastName !== (business.last_name ?? '')
  ), [firstName, lastName, business])

  const dirtyBusiness = useMemo(() => (
    businessName !== business.business_name ||
    businessType !== business.business_type ||
    address !== (business.address ?? '')
  ), [businessName, businessType, address, business])

  const dirtyDetails = useMemo(() => (
    gmbVisible !== business.gmb_visible ||
    phone !== (business.phone ?? '') ||
    gmbUrl !== (business.gmb_url ?? '') ||
    description !== (business.description ?? '') ||
    openingHours !== (business.opening_hours ?? '')
  ), [gmbVisible, phone, gmbUrl, description, openingHours, business])

  async function saveSection(section: 'personal' | 'business' | 'details') {
    setSavingSection(section)
    setError(null)
    try {
      const updates: Record<string, unknown> =
        section === 'personal'
          ? { first_name: firstName.trim() || null, last_name: lastName.trim() || null }
          : section === 'business'
          ? {
              business_name: businessName.trim(),
              business_type: businessType,
              address: address.trim() || null,
            }
          : {
              gmb_visible: gmbVisible,
              phone: phone.trim() || null,
              gmb_url: gmbUrl.trim() || null,
              description: description.trim() || null,
              opening_hours: openingHours.trim() || null,
            }

      const { error: dbError } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', business.id)

      if (dbError) throw dbError
      setSavedSection(section)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde.')
    } finally {
      setSavingSection(null)
    }
  }

  async function handleShare() {
    if (!business.short_code) return
    const url = `${window.location.origin}/?code=${business.short_code}`
    try {
      if (navigator.share) {
        await navigator.share({ title: businessName, url })
      } else {
        await navigator.clipboard.writeText(url)
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 2000)
      }
    } catch {
      // user dismissed share sheet
    }
  }

  const displayTitle = firstName ? `${firstName}${lastName ? ' ' + lastName : ''}` : businessName
  const displaySubtitle = firstName ? businessName : (address || 'Ajoutez votre adresse')

  return (
    <div className="flex flex-col bg-secondary">
      {/* Page header */}
      <header className="bg-primary border-b border-secondary">
        <div className="relative">
          {/* Banner */}
          <div className="relative h-[160px] md:h-[200px] w-full overflow-hidden bg-brand-secondary">
            {bannerUrl ? (
              <Image
                src={bannerUrl}
                alt="Bannière"
                fill
                className="object-cover"
                unoptimized
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-brand-100 to-brand-50" />
            )}
            {/* Badge "ajouter / changer banniere" : ancre l'idee qu'elle est editable */}
            <div className="absolute right-4 top-4">
              <a
                href="#banner-upload"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary/90 backdrop-blur px-3 py-1.5 text-xs font-semibold text-secondary ring-1 ring-secondary shadow-xs hover:bg-primary"
              >
                <Camera01 className="size-3.5" />
                {bannerUrl ? 'Modifier' : 'Ajouter une bannière'}
              </a>
            </div>
          </div>

          {/* Avatar logo + titre + actions */}
          <div className="px-4 md:px-8 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 -mt-12 md:-mt-16">
              <div className="size-24 md:size-32 rounded-full bg-primary ring-4 ring-primary shadow-lg overflow-hidden flex items-center justify-center shrink-0">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={businessName}
                    width={160}
                    height={160}
                    className="w-full h-full object-contain p-2"
                    unoptimized
                  />
                ) : (
                  <span className="text-3xl md:text-4xl font-bold text-fg-brand-primary">
                    {businessName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 flex flex-col md:flex-row md:items-end md:justify-between gap-3 min-w-0 md:pb-2">
                <div className="min-w-0">
                  <h1 className="text-display-xs md:text-display-sm font-semibold text-primary truncate">
                    {displayTitle}
                  </h1>
                  <p className="text-sm md:text-md text-tertiary truncate">
                    {displaySubtitle}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    color="secondary"
                    iconLeading={shareCopied ? CheckDone01 : Share04}
                    onClick={handleShare}
                    isDisabled={!business.short_code}
                  >
                    {shareCopied ? 'Lien copié' : 'Partager'}
                  </Button>
                  <Button
                    size="sm"
                    color="primary"
                    iconLeading={ArrowUpRight}
                    href={gmbUrl ? (gmbUrl.startsWith('http') ? gmbUrl : `https://${gmbUrl}`) : undefined}
                    isDisabled={!gmbUrl}
                  >
                    Voir fiche
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 md:px-8 py-6 md:py-12 flex flex-col gap-8 md:gap-12 max-w-[1080px] w-full mx-auto">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-error-primary ring-1 ring-error_subtle px-4 py-3">
            <AlertCircle className="size-5 text-fg-error-primary shrink-0" />
            <p className="text-sm font-medium text-error-primary">{error}</p>
          </div>
        )}

        {/* Section 1 : Infos personnelles */}
        <Section
          title="Infos personnelles"
          subtitle="Mettez à jour vos informations personnelles. Le prénom est utilisé pour les salutations dans l'app."
          icon={User01}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Prénom" value={firstName} onChange={setFirstName} placeholder="Marie" />
            <Input label="Nom" value={lastName} onChange={setLastName} placeholder="Dupont" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Email</label>
            <div className="px-3.5 py-2.5 rounded-lg ring-1 ring-secondary bg-secondary text-sm text-tertiary">
              {email}
            </div>
            <p className="text-xs text-tertiary mt-1.5">
              Pour modifier votre email, allez dans <strong className="font-medium">Sécurité</strong>.
            </p>
          </div>
          <SectionFooter
            isDirty={dirtyPersonal}
            isSaving={savingSection === 'personal'}
            isSaved={savedSection === 'personal'}
            onSave={() => saveSection('personal')}
          />
        </Section>

        {/* Section 2 : Mon entreprise */}
        <Section
          title="Mon entreprise"
          subtitle="Informations de votre commerce, visibles par vos clients."
          icon={Building07}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nom du commerce"
              value={businessName}
              onChange={setBusinessName}
              isRequired
              placeholder="Café du Marché"
            />
            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">Activité</label>
              <div className="grid grid-cols-3 gap-2">
                {ACTIVITIES.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setBusinessType(a.value)}
                    className={cx(
                      'px-2 py-2 rounded-lg ring-1 text-xs font-semibold transition-colors cursor-pointer',
                      businessType === a.value
                        ? 'ring-2 ring-brand bg-brand-secondary text-brand-secondary'
                        : 'ring-secondary bg-primary text-secondary hover:bg-secondary',
                    )}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Input
            label="Adresse"
            icon={MarkerPin01}
            value={address}
            onChange={setAddress}
            placeholder="15 rue de la Paix, 75002 Paris"
          />

          <div id="banner-upload" className="pt-2">
            <p className="text-sm font-medium text-secondary mb-2">Logo du commerce</p>
            <AssetUploader
              kind="logo"
              currentUrl={logoUrl}
              onUploaded={(url) => { setLogoUrl(url); router.refresh() }}
              onDeleted={() => { setLogoUrl(null); router.refresh() }}
            />
          </div>

          <div className="pt-2">
            <p className="text-sm font-medium text-secondary mb-2">Bannière</p>
            <AssetUploader
              kind="banner"
              currentUrl={bannerUrl}
              onUploaded={(url) => { setBannerUrl(url); router.refresh() }}
              onDeleted={() => { setBannerUrl(null); router.refresh() }}
            />
          </div>

          <SectionFooter
            isDirty={dirtyBusiness}
            isSaving={savingSection === 'business'}
            isSaved={savedSection === 'business'}
            onSave={() => saveSection('business')}
            disabled={businessName.trim().length === 0}
          />
        </Section>

        {/* Section 3 : Details du commerce */}
        <Section
          title="Détails du commerce"
          subtitle="Informations complémentaires affichées sur la carte de fidélité de vos clients."
          icon={Globe01}
        >
          <div className="flex items-start gap-3 rounded-lg bg-secondary px-4 py-3">
            <Toggle
              size="sm"
              isSelected={gmbVisible}
              onChange={setGmbVisible}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-secondary">Visible sur la fiche client</p>
              <p className="text-xs text-tertiary">
                Afficher téléphone, horaires et lien Google sur la carte de fidélité.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Téléphone"
              icon={Phone}
              value={phone}
              onChange={setPhone}
              placeholder="01 23 45 67 89"
              type="tel"
            />
            <Input
              label="Lien Google My Business"
              value={gmbUrl}
              onChange={setGmbUrl}
              placeholder="https://g.page/votre-commerce"
              hint="Permet à vos clients de laisser un avis Google."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Horaires d'ouverture</label>
            <Input
              icon={Clock}
              value={openingHours}
              onChange={setOpeningHours}
              placeholder="Ex : Lun-Ven 9h-18h"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {HOUR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setOpeningHours(preset)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md ring-1 ring-secondary text-tertiary hover:bg-secondary cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-secondary">Description du commerce</label>
              <span className={cx(
                'text-xs',
                description.length > MAX_DESC ? 'text-error-primary' : 'text-tertiary',
              )}>
                {description.length} / {MAX_DESC}
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
              placeholder="Boulangerie artisanale depuis 1987. Pains au levain, viennoiseries maison et pâtisseries fines."
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-lg ring-1 ring-secondary bg-primary text-md text-primary placeholder:text-placeholder shadow-xs focus:outline-2 focus:outline-brand resize-none"
            />
          </div>

          {/* Map placeholder */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Aperçu cartographique</label>
            <div className="aspect-[3/1] rounded-lg ring-1 ring-secondary bg-secondary flex flex-col items-center justify-center gap-2">
              <MarkerPin01 className="size-6 text-fg-quaternary" />
              <p className="text-sm text-tertiary text-center px-4">
                {address
                  ? 'L\'aperçu cartographique sera disponible prochainement'
                  : 'Renseignez votre adresse pour afficher l\'aperçu'}
              </p>
              {address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-secondary hover:underline"
                >
                  Ouvrir dans Google Maps
                  <ArrowUpRight className="size-3" />
                </a>
              )}
            </div>
          </div>

          <SectionFooter
            isDirty={dirtyDetails}
            isSaving={savingSection === 'details'}
            isSaved={savedSection === 'details'}
            onSave={() => saveSection('details')}
          />
        </Section>
      </main>
    </div>
  )
}

// ── Sous-composants ───────────────────────────────────────────

function Section({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
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
        <div className="p-4 md:p-6 flex flex-col gap-5">
          {children}
        </div>
      </div>
    </section>
  )
}

function SectionFooter({
  isDirty,
  isSaving,
  isSaved,
  onSave,
  disabled,
}: {
  isDirty: boolean
  isSaving: boolean
  isSaved: boolean
  onSave: () => void
  disabled?: boolean
}) {
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
        Enregistrer
      </Button>
    </div>
  )
}
