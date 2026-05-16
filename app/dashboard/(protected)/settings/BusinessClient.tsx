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
  Download01, Copy01, X as XIcon,
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
  // Modal "Partager" : preview de la fiche image generee cote serveur
  // (/api/share-card/[shortCode]) avec download + share file + copy lien.
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareCardBusting, setShareCardBusting] = useState(0) // force refresh de la preview apres save

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
    phone !== (business.phone ?? '') ||
    gmbUrl !== (business.gmb_url ?? '') ||
    websiteUrl !== (business.website_url ?? '') ||
    bookingUrl !== (business.booking_url ?? '') ||
    description !== (business.description ?? '') ||
    openingHours !== (business.opening_hours ?? '')
  ), [firstName, lastName, businessName, address, phone, gmbUrl, websiteUrl, bookingUrl, description, openingHours, business])

  async function handleSaveAll() {
    if (!isDirty || saving) return
    setSaving(true)
    setError(null)
    try {
      const { error: dbError } = await supabase
        .from('businesses')
        .update({
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          business_name: businessName.trim(),
          address: address.trim() || null,
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
    setPhone(business.phone ?? '')
    setGmbUrl(business.gmb_url ?? '')
    setDescription(business.description ?? '')
    setOpeningHours(business.opening_hours ?? '')
  }

  function handleShare() {
    // Refonte 2026-05-13 : ouvre une modal avec PREVIEW de la fiche image
    // partageable (genere via /api/share-card/[shortCode]). Le user peut
    // ensuite telecharger l'image, la partager via navigator.share avec
    // file (story Insta-friendly), ou copier le lien.
    setShareCardBusting(Date.now())
    setShowShareModal(true)
  }

  async function handleCopyShareLink() {
    const target = business.short_code || business.id
    const url = joinUrl(target)
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch {
      /* clipboard refuse */
    }
  }

  async function handleDownloadShareCard() {
    const target = business.short_code || business.id
    try {
      const res = await fetch(`/api/share-card/${target}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('share-card fetch failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-izou.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1500)
    } catch (e) {
      console.error('[share] download failed', e)
    }
  }

  async function handleShareFile() {
    const target = business.short_code || business.id
    try {
      const res = await fetch(`/api/share-card/${target}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('share-card fetch failed')
      const blob = await res.blob()
      const file = new File([blob], `${businessName}.png`, { type: 'image/png' })
      const shareData: ShareData = {
        title: businessName,
        text: `Rejoignez le programme fidélité de ${businessName} sur Izou.`,
        url: joinUrl(target),
      }
      // Web Share Level 2 (avec files) — iOS Safari 15+, Chrome Android, Edge
      if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
        shareData.files = [file]
      }
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback : download local
        await handleDownloadShareCard()
      }
    } catch (e) {
      // User dismissed ou erreur silencieuse
      if (e instanceof Error && e.name !== 'AbortError') {
        console.error('[share] file failed', e)
      }
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

  const shareCardUrl = business.short_code
    ? `/api/share-card/${business.short_code}?v=${shareCardBusting}`
    : null

  return (
    <>
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
                  businessName={business.business_name}
                  businessLogoUrl={logoUrl}
                  cardImageUrl={cardImageUrl}
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

    {/* Modal Partager — fiche image generee cote serveur, format Insta-friendly.
        Permet au merchant de telecharger / partager en story sans devoir faire
        de screenshot moche. */}
    {showShareModal && shareCardUrl && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Partager ma fiche commerce"
        className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/70 backdrop-blur-sm p-4"
        onClick={() => setShowShareModal(false)}
      >
        <div
          className="bg-primary rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="text-lg font-bold text-primary">Partager mon commerce</h2>
            <button
              type="button"
              onClick={() => setShowShareModal(false)}
              aria-label="Fermer"
              className="size-8 rounded-full flex items-center justify-center text-tertiary hover:bg-secondary"
            >
              <XIcon className="size-5" aria-hidden="true" />
            </button>
          </div>

          <p className="px-5 text-sm text-tertiary mb-4">
            Image prête à partager en story ou message. Le QR code intégré redirige vers la page d&apos;inscription de votre commerce.
          </p>

          {/* Preview de la share card (4:5 ratio) */}
          <div className="mx-5 mb-4 rounded-2xl overflow-hidden ring-1 ring-secondary bg-secondary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shareCardUrl}
              alt="Aperçu fiche partage"
              className="w-full h-auto block"
            />
          </div>

          <div className="px-5 pb-5 space-y-2.5">
            <Button
              type="button"
              size="md"
              color="primary"
              iconLeading={Share04}
              className="w-full"
              onClick={handleShareFile}
            >
              Partager l&apos;image
            </Button>
            <Button
              type="button"
              size="md"
              color="secondary"
              iconLeading={Download01}
              className="w-full"
              onClick={handleDownloadShareCard}
            >
              Télécharger l&apos;image
            </Button>
            <Button
              type="button"
              size="md"
              color="tertiary"
              iconLeading={shareCopied ? CheckDone01 : Copy01}
              className="w-full"
              onClick={handleCopyShareLink}
            >
              {shareCopied ? 'Lien copié' : 'Copier le lien'}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
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
