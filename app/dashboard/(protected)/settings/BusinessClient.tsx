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
import { useRouter } from 'next/navigation'
import {
  Building07, MarkerPin01, Phone, Clock, Share04, ArrowUpRight,
  CheckDone01, AlertCircle, Globe01, User01,
} from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import { Input } from '@/components/ui/base/input/input'
import { AssetUploader } from '@/components/dashboard/AssetUploader'
import {
  SettingsPage, SettingsHeader, SettingsBody, SettingsSection,
} from '@/components/dashboard/SettingsLayout'
import { createClient } from '@/lib/supabase/client'
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

  // Logo + bannière
  const [logoUrl, setLogoUrl] = useState<string | null>(business.logo_url)
  const [bannerUrl, setBannerUrl] = useState<string | null>(business.banner_url)

  // Infos personnelles
  const [firstName, setFirstName] = useState(business.first_name ?? '')
  const [lastName, setLastName] = useState(business.last_name ?? '')

  // Mon entreprise
  const [businessName, setBusinessName] = useState(business.business_name)
  const [address, setAddress] = useState(business.address ?? '')

  // Details du commerce
  const [phone, setPhone] = useState(business.phone ?? '')
  const [gmbUrl, setGmbUrl] = useState(business.gmb_url ?? '')
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
    phone !== (business.phone ?? '') ||
    gmbUrl !== (business.gmb_url ?? '') ||
    description !== (business.description ?? '') ||
    openingHours !== (business.opening_hours ?? '')
  ), [firstName, lastName, businessName, address, phone, gmbUrl, description, openingHours, business])

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

  const headerActions = (
    <>
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
    </>
  )

  return (
    <SettingsPage>
      <SettingsHeader
        title={businessName}
        subtitle={address || 'Ajoutez votre adresse pour qu’elle apparaisse ici'}
        leading={headerLeading}
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
              Pour modifier votre email, allez dans <strong className="font-medium">Sécurité</strong>.
            </p>
          </div>
        </SettingsSection>

        {/* Section 2 : Mon entreprise */}
        <SettingsSection
          title="Mon entreprise"
          subtitle="Identité visuelle et localisation de votre commerce."
          icon={Building07}
        >
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

          <div className="pt-2">
            <p className="text-sm font-medium text-secondary mb-2">Logo du commerce</p>
            <AssetUploader
              kind="logo"
              currentUrl={logoUrl}
              onUploaded={(url) => { setLogoUrl(url); router.refresh() }}
              onDeleted={() => { setLogoUrl(null); router.refresh() }}
            />
          </div>

          <div className="pt-2">
            <p className="text-sm font-medium text-secondary mb-2">Bannière de votre fiche entreprise</p>
            <AssetUploader
              kind="banner"
              currentUrl={bannerUrl}
              onUploaded={(url) => { setBannerUrl(url); router.refresh() }}
              onDeleted={() => { setBannerUrl(null); router.refresh() }}
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
            <Input
              label="Lien Google My Business"
              value={gmbUrl}
              onChange={setGmbUrl}
              placeholder="https://g.page/votre-commerce"
              hint="Permet à vos clients de laisser un avis Google."
            />
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
