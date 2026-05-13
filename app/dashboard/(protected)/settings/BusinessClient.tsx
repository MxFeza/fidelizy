'use client'

/**
 * Mon entreprise (Story 8.1) — refonte 2026-04-27 sur retour user.
 *
 * Decisions integrees :
 *  - Banniere retiree (l'identite visuelle = logo + couleur primaire)
 *  - Activite retiree du formulaire (deja definie a l'onboarding J3)
 *  - Toggle "Visible sur fiche client" retire (les details sont
 *    toujours visibles cote client)
 *  - Logo via <img> natif pour eviter les soucis de cache/optim Next
 *  - Apercu cartographique via OpenStreetMap embed (gratuit, pas de cle)
 *
 * Le ratio uploade pour le logo est PRESERVE partout (sidebar, cartes
 * loyalty, Apple/Google Wallet) via object-contain.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building07, MarkerPin01, Phone, Clock, Share04,
  CheckDone01, AlertCircle, Globe01, User01, LinkExternal01,
} from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import { Input } from '@/components/ui/base/input/input'
import { AssetUploader } from '@/components/dashboard/AssetUploader'
import LoyaltyCardVisual from '@/components/dashboard/LoyaltyCardVisual'
import {
  SettingsPage, SettingsHeader, SettingsBody, SettingsSection,
} from '@/components/dashboard/SettingsLayout'
import { createClient } from '@/lib/supabase/client'
import { joinUrl } from '@/lib/config'
import type { Business } from '@/lib/types'
import { cx } from '@/utils/cx'

interface BusinessClientProps {
  business: Business
  email: string
}

const HOUR_PRESETS = [
  'Lun-Ven : 9h-18h',
  'Lun-Sam : 8h-19h',
  'Mar-Sam : 10h-19h',
  'Tous les jours : 7h-22h',
]

const MAX_DESC = 280

/**
 * Charte couleur du commerce. Le merchant choisit dans cette palette ; le
 * champ accepte aussi un hex libre pour une charte spécifique.
 *
 * La couleur est appliquée à la carte loyalty (fond), la progress bar des
 * paliers, et aux états "récompense débloquée" sur la fiche client.
 * Default DB historique = #6366f1 (indigo), nettoyé en Brand Izou.
 */
const COLOR_PRESETS = [
  { value: '#7F56D9', label: 'Violet Izou' },
  { value: '#0F172A', label: 'Noir' },
  { value: '#E11D48', label: 'Rouge' },
  { value: '#2563EB', label: 'Bleu' },
  { value: '#16A34A', label: 'Vert' },
  { value: '#F59E0B', label: 'Orange' },
] as const

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/

export default function BusinessClient({ business, email }: BusinessClientProps) {
  const router = useRouter()
  const supabase = createClient()

  // Logo + bannière + image carte
  const [logoUrl, setLogoUrl] = useState<string | null>(business.logo_url)
  const [bannerUrl, setBannerUrl] = useState<string | null>(business.banner_url)
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(business.card_image_url)

  // Infos personnelles
  const [firstName, setFirstName] = useState(business.first_name ?? '')
  const [lastName, setLastName] = useState(business.last_name ?? '')

  // Mon entreprise
  const [businessName, setBusinessName] = useState(business.business_name)
  const [address, setAddress] = useState(business.address ?? '')
  const [primaryColor, setPrimaryColor] = useState(business.primary_color || '#7F56D9')

  // Details du commerce
  const [phone, setPhone] = useState(business.phone ?? '')
  const [gmbUrl, setGmbUrl] = useState(business.gmb_url ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(business.website_url ?? '')
  const [bookingUrl, setBookingUrl] = useState(business.booking_url ?? '')
  const [description, setDescription] = useState(business.description ?? '')
  const [openingHours, setOpeningHours] = useState(business.opening_hours ?? '')

  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)

  useEffect(() => {
    if (!savedAt) return
    const t = setTimeout(() => setSavedAt(null), 2500)
    return () => clearTimeout(t)
  }, [savedAt])

  // Une seule "dirty" globale : true si n'importe quel champ a change.
  const isDirty = useMemo(() => (
    firstName !== (business.first_name ?? '') ||
    lastName !== (business.last_name ?? '') ||
    businessName !== business.business_name ||
    address !== (business.address ?? '') ||
    primaryColor !== (business.primary_color || '#7F56D9') ||
    phone !== (business.phone ?? '') ||
    gmbUrl !== (business.gmb_url ?? '') ||
    websiteUrl !== (business.website_url ?? '') ||
    bookingUrl !== (business.booking_url ?? '') ||
    description !== (business.description ?? '') ||
    openingHours !== (business.opening_hours ?? '')
  ), [firstName, lastName, businessName, address, primaryColor, phone, gmbUrl, websiteUrl, bookingUrl, description, openingHours, business])

  async function handleSaveAll() {
    if (!isDirty || saving) return
    setSaving(true)
    setError(null)
    try {
      // Guard hex format avant l'envoi pour éviter de persister une valeur
      // libre type "indigo" — la DB l'accepte mais la carte loyalty ne saurait
      // pas l'afficher.
      const safePrimary = HEX_REGEX.test(primaryColor) ? primaryColor.toUpperCase() : '#7F56D9'

      const { error: dbError } = await supabase
        .from('businesses')
        .update({
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          business_name: businessName.trim(),
          address: address.trim() || null,
          primary_color: safePrimary,
          phone: phone.trim() || null,
          gmb_url: gmbUrl.trim() || null,
          website_url: websiteUrl.trim() || null,
          booking_url: bookingUrl.trim() || null,
          description: description.trim() || null,
          opening_hours: openingHours.trim() || null,
        })
        .eq('id', business.id)

      if (dbError) throw dbError
      setSavedAt(new Date())
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setFirstName(business.first_name ?? '')
    setLastName(business.last_name ?? '')
    setBusinessName(business.business_name)
    setAddress(business.address ?? '')
    setPrimaryColor(business.primary_color || '#7F56D9')
    setPhone(business.phone ?? '')
    setGmbUrl(business.gmb_url ?? '')
    setDescription(business.description ?? '')
    setOpeningHours(business.opening_hours ?? '')
  }

  async function handleShare() {
    // Le lien doit pointer vers la page d'inscription du commerce
    // (preview riche OG avec banner + logo via generateMetadata dans
    // app/join/[businessId]/page.tsx). Avant 2026-05-12 le lien tapait
    // sur /?code=X qui n'avait pas de traitement spécial.
    const target = business.short_code || business.id
    const url = joinUrl(target)
    const title = `Carte de fidélité ${businessName}`
    const text = `Rejoignez le programme fidélité de ${businessName} sur Izou.`
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title, text, url })
      } else {
        await navigator.clipboard.writeText(url)
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 2000)
      }
    } catch {
      // user dismissed share sheet
    }
  }

  const headerLeading = (
    <div className="size-20 md:size-24 rounded-full bg-secondary ring-1 ring-secondary overflow-hidden flex items-center justify-center shrink-0">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={businessName}
          className="w-full h-full object-contain p-1.5"
        />
      ) : (
        <span className="text-2xl md:text-3xl font-bold text-fg-quaternary">
          {businessName.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )

  // U2.A1 (2026-05-12) : retrait du CTA "Voir fiche" du header — il faisait
  // doublon avec le champ "Lien Google My Business" édité plus bas, et
  // restait désactivé tant que le lien n'était pas configuré.
  // Le user qui veut tester son lien GMB le fait depuis le hint "Tester"
  // sous le champ d'édition (cf. plus bas dans le form).
  const headerActions = (
    <Button
      size="sm"
      color="primary"
      iconLeading={shareCopied ? CheckDone01 : Share04}
      onClick={handleShare}
      isDisabled={!business.short_code}
    >
      {shareCopied ? 'Lien copié' : 'Partager'}
    </Button>
  )

  return (
    <SettingsPage>
      {/* Hero pattern LinkedIn : bannière full-width + logo qui chevauche en
          bas-gauche. Bannière éditable via l'icône crayon flottante (variant
          overlay). Le logo reste éditable dans la section "Mon entreprise"
          plus bas pour ne pas dupliquer l'uploader. */}
      <div className="relative w-full">
        <div className="max-w-[1080px] mx-auto px-4 md:px-8 pt-4 md:pt-6">
          <AssetUploader
            kind="banner"
            variant="overlay"
            currentUrl={bannerUrl}
            onUploaded={(url) => { setBannerUrl(url); router.refresh() }}
            onDeleted={() => { setBannerUrl(null); router.refresh() }}
          />
          {/* Logo qui chevauche le bas de la bannière (style LinkedIn). */}
          <div className="relative h-12 md:h-14">
            <div className="absolute -top-12 md:-top-14 left-2 md:left-6 size-24 md:size-28 rounded-full bg-primary ring-4 ring-primary overflow-hidden flex items-center justify-center shrink-0 shadow-md">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={businessName} className="w-full h-full object-contain p-1.5" />
              ) : (
                <span className="text-2xl md:text-3xl font-bold text-fg-quaternary">
                  {businessName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <SettingsHeader
        title={businessName}
        subtitle={address || 'Ajoutez votre adresse pour qu’elle apparaisse ici'}
        actions={headerActions}
      />

      <SettingsBody>
        {error && (
          <div className="flex items-center gap-2 rounded-lg ring-1 ring-error_subtle bg-error-primary px-4 py-3">
            <AlertCircle className="size-5 text-fg-error-primary shrink-0" />
            <p className="text-sm font-medium text-error-primary">{error}</p>
          </div>
        )}

        {/* Section 1 : Infos personnelles */}
        <SettingsSection
          title="Infos personnelles"
          subtitle="Le prénom est utilisé pour les salutations dans l’app."
          icon={User01}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Prénom" value={firstName} onChange={setFirstName} placeholder="Marie" />
            <Input label="Nom" value={lastName} onChange={setLastName} placeholder="Dupont" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Email</label>
            <div className="px-3.5 py-2.5 rounded-lg ring-1 ring-secondary bg-secondary text-md text-tertiary">
              {email}
            </div>
            <p className="text-xs text-tertiary mt-1.5">
              Pour modifier votre email, allez dans{' '}
              <Link
                href="/dashboard/security"
                className="font-medium text-brand-secondary hover:text-brand-secondary_hover underline"
              >
                Sécurité
              </Link>.
            </p>
          </div>
        </SettingsSection>

        {/* Section 2 : Mon entreprise */}
        <SettingsSection
          title="Mon entreprise"
          subtitle="Identité visuelle et localisation de votre commerce."
          icon={Building07}
        >
          <div data-tour="business-info" className="space-y-4">
            <Input
              label="Nom du commerce"
              value={businessName}
              onChange={setBusinessName}
              isRequired
              placeholder="Café du Marché"
            />

            <Input
              label="Adresse"
              icon={MarkerPin01}
              value={address}
              onChange={setAddress}
              placeholder="15 rue de la Paix, 75002 Paris"
            />
          </div>

          <div data-tour="logo-upload" className="pt-2">
            <p className="text-sm font-medium text-secondary mb-2">Logo du commerce</p>
            <AssetUploader
              kind="logo"
              currentUrl={logoUrl}
              onUploaded={(url) => { setLogoUrl(url); router.refresh() }}
              onDeleted={() => { setLogoUrl(null); router.refresh() }}
            />
          </div>

          {/* Color picker — la charte couleur s'applique partout côté client
              (carte loyalty, progress bar paliers, états récompense débloquée).
              Default historique = #6366f1 indigo, on guide vers la palette Izou
              ou un hex custom (validé HEX_REGEX). Ajouté 2026-05-12 suite à
              retour user "la carte est bleue alors qu'on n'a rien configuré". */}
          <div className="pt-2">
            <p className="text-sm font-medium text-secondary mb-2">Couleur de votre charte</p>
            <p className="text-xs text-tertiary mb-3">
              Appliquée à la carte de fidélité, à la barre de progression et aux récompenses débloquées.
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {COLOR_PRESETS.map((preset) => {
                const isActive = primaryColor.toUpperCase() === preset.value.toUpperCase()
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setPrimaryColor(preset.value)}
                    aria-label={preset.label}
                    aria-pressed={isActive}
                    title={preset.label}
                    className={cx(
                      'size-10 rounded-full transition-all ring-2 ring-offset-2 ring-offset-primary',
                      isActive ? 'ring-brand scale-105' : 'ring-transparent hover:ring-secondary',
                    )}
                    style={{ backgroundColor: preset.value }}
                  />
                )
              })}
            </div>
            <Input
              label="Hex personnalisé"
              value={primaryColor}
              onChange={(v) => setPrimaryColor(v.startsWith('#') ? v : `#${v}`)}
              placeholder="#7F56D9"
              hint={HEX_REGEX.test(primaryColor) ? undefined : 'Format attendu : #RRGGBB'}
              isInvalid={!HEX_REGEX.test(primaryColor)}
            />
          </div>

          <div className="pt-2">
            <p className="text-sm font-medium text-secondary mb-2">Image de votre carte de fidélité</p>
            <AssetUploader
              kind="card"
              currentUrl={cardImageUrl}
              onUploaded={(url) => { setCardImageUrl(url); router.refresh() }}
              onDeleted={() => { setCardImageUrl(null); router.refresh() }}
              cardPreview={
                <LoyaltyCardVisual
                  customerName={firstName?.trim() || 'Aperçu'}
                  loyaltyType={business.loyalty_type}
                  currentStamps={Math.min(3, business.stamps_required ?? 10)}
                  stampsRequired={business.stamps_required ?? 10}
                  currentPoints={50}
                  businessLogoUrl={logoUrl}
                  cardImageUrl={cardImageUrl}
                  businessPrimaryColor={HEX_REGEX.test(primaryColor) ? primaryColor : null}
                  withGradientBackground={false}
                />
              }
            />
          </div>

        </SettingsSection>

        {/* Section 3 : Details du commerce */}
        <SettingsSection
          title="Détails du commerce"
          subtitle="Ces informations sont visibles par vos clients sur leur carte de fidélité."
          icon={Globe01}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Téléphone"
              icon={Phone}
              value={phone}
              onChange={setPhone}
              placeholder="01 23 45 67 89"
              type="tel"
            />
            <div>
              <Input
                label="Lien Google My Business"
                value={gmbUrl}
                onChange={setGmbUrl}
                placeholder="https://g.page/votre-commerce"
                hint="Permet à vos clients de laisser un avis Google."
              />
              <TestLink value={gmbUrl} label="Tester le lien GMB" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Site internet"
                icon={Globe01}
                value={websiteUrl}
                onChange={setWebsiteUrl}
                placeholder="https://votre-commerce.fr"
                hint="Optionnel — affiché sur la fiche de votre commerce."
              />
              <TestLink value={websiteUrl} label="Ouvrir le site" />
            </div>
            <div>
              <Input
                label="Lien de réservation"
                value={bookingUrl}
                onChange={setBookingUrl}
                placeholder="https://treatwell.fr/votre-commerce"
                hint="Resamania, Treatwell, TheFork, Calendly… apparaît comme bouton « Réserver »."
              />
              <TestLink value={bookingUrl} label="Tester la réservation" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Horaires d&apos;ouverture</label>
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

          {/* Apercu cartographique : OpenStreetMap embed (pas de cle API) */}
          <MapPreview address={address} />
        </SettingsSection>

        {/* Save bar globale : 1 seul Enregistrer pour toute la page (static, pas sticky — feedback user 2026-05-01) */}
        <div className="mt-2 flex items-center justify-end gap-3 px-0 py-0">
          {savedAt && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success-primary">
              <CheckDone01 className="size-4" />
              Modifications enregistrées
            </span>
          )}
          <Button
            size="sm"
            color="secondary"
            onClick={handleReset}
            isDisabled={!isDirty || saving}
          >
            Annuler
          </Button>
          <Button
            size="sm"
            color="primary"
            onClick={handleSaveAll}
            isDisabled={!isDirty || saving || businessName.trim().length === 0}
            isLoading={saving}
          >
            Enregistrer les modifications
          </Button>
        </div>
      </SettingsBody>
    </SettingsPage>
  )
}

/**
 * Petit lien "Tester" affiche sous les inputs URL quand le user a saisi
 * une valeur. Évite le copier-coller pour valider que le lien marche, et
 * remplace le bouton "Voir fiche" du header qui faisait doublon (U2.A1+A3,
 * 2026-05-12). Le lien tolère les URL sans `https://` au début (normalisé
 * comme le `href` du header avant).
 */
function TestLink({ value, label }: { value: string; label: string }) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const href = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs font-medium text-brand-secondary hover:text-brand-secondary_hover hover:underline mt-1.5"
    >
      <LinkExternal01 className="size-3" aria-hidden="true" />
      {label}
    </a>
  )
}

/**
 * Apercu cartographique via Google Maps embed (sans cle API).
 * Le parametre `q={query}&output=embed` est public et stable, utilise
 * par d'innombrables sites. Pas de geocodage cote nous, Google s'en charge.
 *
 * Si pas d'adresse renseignee, on affiche un placeholder.
 */
function MapPreview({ address }: { address: string }) {
  const trimmed = address.trim()

  return (
    <div>
      <label className="block text-sm font-medium text-secondary mb-1.5">Aperçu cartographique</label>
      {trimmed ? (
        <div className="rounded-lg ring-1 ring-secondary overflow-hidden">
          <iframe
            title="Aperçu cartographique"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(trimmed)}&hl=fr&z=15&output=embed`}
            className="w-full aspect-[3/1] block"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <div className="aspect-[3/1] rounded-lg ring-1 ring-secondary bg-secondary flex flex-col items-center justify-center gap-2">
          <MarkerPin01 className="size-6 text-fg-quaternary" />
          <p className="text-sm text-tertiary text-center px-4">
            Renseignez votre adresse pour afficher l&apos;aperçu
          </p>
        </div>
      )}
    </div>
  )
}
