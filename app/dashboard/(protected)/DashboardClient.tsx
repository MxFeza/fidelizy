'use client'

/**
 * Dashboard commercant — vue d'ensemble (Figma E1).
 * Refactor complet 2026-04-25 pour matcher le design v4 Untitled UI.
 *
 * Sections :
 *   1. Page header     — titre "Bonjour, {prenom}" + actions (Bell, Exporter, Scanner client)
 *   2. KPIs principaux — chart Visites de la semaine + carte Code commerce (QR + lien)
 *   3. Filtres + KPIs  — chips de filtre + 4 cards row 1 + 3 cards row 2
 *   4. Activites       — table des derniers scans
 *
 * Dettes documentees :
 *   - Pas de "Revenus estimes" (necessite tracking valeur transaction)
 *   - Pas de variation %"vs mois dernier" (necessite snapshots historiques)
 *   - Hero balloon image : reuse temporaire de auth-balloons-landscape.webp,
 *     a remplacer par un asset dedie quand le user en fournit un.
 */

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import {
  Bell01,
  Download01,
  QrCode01,
  Edit05,
  ArrowUp,
  ArrowDown,
  Copy01,
  CheckDone01,
  Loading01,
  X as XIcon,
  Trophy01,
} from '@untitledui/icons'
import type { Business } from '@/lib/types'
import { joinUrl } from '@/lib/config'
import { Button } from '@/components/ui/base/buttons/button'
import { Emoji, type EmojiName } from '@/lib/emojis'
import { PUBLIC_ASSETS } from '@/lib/assets'
import { cx } from '@/utils/cx'

const TOP_RANK_EMOJIS: EmojiName[] = ['medal-gold', 'medal-silver', 'medal-bronze']

const QrScanner = dynamic(() => import('@/app/components/QrScanner'), { ssr: false })
const WelcomeModal = dynamic(() => import('@/components/dashboard/WelcomeModal'), { ssr: false })

type RecentScan = {
  id: string
  type: string
  stamps_added: number | null
  points_added: number | null
  created_at: string
  loyalty_cards: {
    current_stamps: number
    current_points: number
    customers: { first_name: string; phone: string } | null
  } | null
}

type Kpis = {
  visitsToday: number
  visitsMonth: number
  newClientsMonth: number
  distributedMonth: number
  loyaltyType: string
  tauxRetour: number
  frequenceMoyenne: number
  clientsTotal: number
  clientsActifs: number
  clientsInactifs: number
  clientsARisque: number
  clientsPerdus: number
}

type TopClient = {
  id: string
  total_visits: number
  last_visit_at: string | null
  current_stamps: number
  current_points: number
  customers: { first_name: string; phone: string } | null
}

type WeekDay = { label: string; count: number }

interface DashboardClientProps {
  business: Business
  totalCustomers: number
  visitsToday: number
  recentScans: RecentScan[]
  showWelcome?: boolean
}

type ManualModalState =
  | { status: 'idle' }
  | { status: 'processing' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatRelativeDay(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return `Aujourd'hui à ${formatTime(iso)}`
  if (d.toDateString() === yesterday.toDateString()) return `Hier à ${formatTime(iso)}`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' à ' + formatTime(iso)
}

function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  emphasis = 'neutral',
}: {
  label: string
  value: string | number
  delta?: { value: number; direction: 'up' | 'down' }
  deltaLabel?: string
  emphasis?: 'neutral' | 'warning' | 'danger'
}) {
  const valueColor =
    emphasis === 'warning' ? 'text-warning-primary'
    : emphasis === 'danger' ? 'text-error-primary'
    : 'text-primary'

  return (
    <div className="rounded-xl bg-primary border border-secondary p-6">
      <p className="text-sm font-medium text-tertiary">{label}</p>
      <p className={cx('text-display-sm font-semibold mt-3', valueColor)}>{value}</p>
      {(delta || deltaLabel) && (
        <div className="mt-2 flex items-center gap-1.5 text-sm">
          {delta && (
            <span className={cx(
              'inline-flex items-center gap-0.5 font-medium',
              delta.direction === 'up' ? 'text-success-primary' : 'text-error-primary',
            )}>
              {delta.direction === 'up' ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
              {delta.value}%
            </span>
          )}
          {deltaLabel && <span className="text-tertiary">{deltaLabel}</span>}
        </div>
      )}
    </div>
  )
}

export default function DashboardClient({
  business,
  totalCustomers,
  visitsToday,
  recentScans,
  showWelcome = false,
}: DashboardClientProps) {
  const router = useRouter()
  const [scannerOpen, setScannerOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [manualState, setManualState] = useState<ManualModalState>({ status: 'idle' })
  const [codeCopied, setCodeCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [weekData, setWeekData] = useState<WeekDay[]>([])
  const [topClients, setTopClients] = useState<TopClient[]>([])

  // Greeting : prenom du gerant si renseigne dans Mon entreprise, sinon
  // fallback sur le 1er mot du nom du commerce.
  const firstName = business.first_name?.trim() || business.business_name?.split(/\s+/)[0] || ''

  useEffect(() => {
    fetch('/api/dashboard/kpis').then((r) => r.json()).then((data) => { if (!data.error) setKpis(data) }).catch(() => {})
    fetch('/api/dashboard/visits-week').then((r) => r.json()).then((data) => { if (data.days) setWeekData(data.days) }).catch(() => {})
    fetch('/api/dashboard/top-clients').then((r) => r.json()).then((data) => { if (data.topClients) setTopClients(data.topClients) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!business.short_code) return
    import('qrcode').then((QRCode) => {
      QRCode.toDataURL(joinUrl(business.short_code!), {
        width: 600,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: { dark: '#7F56D9', light: '#FFFFFF' },
      }).then(setQrDataUrl).catch(() => {})
    })
  }, [business.short_code])

  async function handleDownloadPdf() {
    if (!business.short_code) return
    setPdfLoading(true)
    try {
      const [QRCode, { default: jsPDF }] = await Promise.all([import('qrcode'), import('jspdf')])
      const qrPng = await QRCode.toDataURL(joinUrl(business.short_code!), {
        width: 800, margin: 2, errorCorrectionLevel: 'H',
        color: { dark: '#7F56D9', light: '#FFFFFF' },
      })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' })
      const pw = pdf.internal.pageSize.getWidth()
      const ph = pdf.internal.pageSize.getHeight()
      const cxPos = pw / 2

      pdf.setFontSize(24); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(127, 86, 217)
      pdf.text('Izou', cxPos, 28, { align: 'center' })
      pdf.setFontSize(20); pdf.setTextColor(16, 24, 40)
      pdf.text(business.business_name ?? 'Mon Commerce', cxPos, 42, { align: 'center' })
      pdf.addImage(qrPng, 'PNG', cxPos - 32.5, 52, 65, 65)
      pdf.setFontSize(32); pdf.setFont('courier', 'bold'); pdf.setTextColor(16, 24, 40)
      pdf.text(business.short_code, cxPos, 132, { align: 'center' })
      pdf.setFontSize(13); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(102, 112, 133)
      pdf.text('Scannez pour rejoindre notre', cxPos, 148, { align: 'center' })
      pdf.text('programme de fidelite', cxPos, 155, { align: 'center' })
      pdf.setFontSize(9); pdf.setTextColor(152, 162, 179)
      pdf.text('izou.app', cxPos, ph - 10, { align: 'center' })

      pdf.save(`izou-qr-${business.short_code}.pdf`)
    } finally {
      setPdfLoading(false)
    }
  }

  function copyShortCode() {
    navigator.clipboard.writeText(business.short_code ?? '')
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  function copyJoinLink() {
    const link = `${window.location.origin}/join/${business.short_code ?? business.id}`
    navigator.clipboard.writeText(link)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleScanSuccess = useCallback(() => router.refresh(), [router])

  function openManual() {
    setManualInput('')
    setManualState({ status: 'idle' })
    setManualOpen(true)
  }

  function closeManual() {
    setManualOpen(false)
    if (manualState.status === 'success') router.refresh()
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const raw = manualInput.trim()
    if (!raw) return
    setManualState({ status: 'processing' })

    // Auto-detection : code de réclamation 6 chars charset sans ambiguïté
    // (Story 4.4) vs QR code carte standard. Le claim code prime — si le format
    // matche on appelle validate-claim et on tombe sur le scan classique sinon.
    const claimInput = raw.replace(/[\s-]/g, '').toUpperCase()
    const isClaimCode = /^[A-HJKMNPQRSTUVWXYZ23456789]{6}$/.test(claimInput)

    try {
      if (isClaimCode) {
        const res = await fetch('/api/scan/validate-claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: claimInput }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          const who = data.customerName ? ` à ${data.customerName}` : ''
          setManualState({
            status: 'success',
            message: `Récompense "${data.rewardName}"${who} validée. La carte du client a été mise à jour.`,
          })
        } else {
          setManualState({ status: 'error', message: data.error ?? 'Code de réclamation invalide.' })
        }
        return
      }

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code_id: raw }),
      })
      const data = await res.json()
      if (data.success) setManualState({ status: 'success', message: data.message })
      else setManualState({ status: 'error', message: data.error ?? 'Erreur lors du traitement.' })
    } catch {
      setManualState({ status: 'error', message: 'Erreur de connexion. Veuillez réessayer.' })
    }
  }

  const isStamps = business.loyalty_type === 'stamps'
  const distributedLabel = isStamps ? 'Tampons distribues' : 'Points distribues'
  const visitsCount = kpis?.visitsMonth ?? 0
  const clientsTotal = kpis?.clientsTotal ?? totalCustomers

  return (
    <>
      {showWelcome && (
        <WelcomeModal
          businessId={business.id}
          businessName={business.business_name}
          shortCode={business.short_code}
          open
        />
      )}

      {/* Hero header */}
      <div className="relative w-full h-[200px] overflow-hidden bg-secondary">
        <Image
          src={PUBLIC_ASSETS.auth.balloons}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-primary to-transparent pointer-events-none" />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6 lg:space-y-8">
        {/* Page header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-display-sm font-semibold text-primary truncate">
              Bonjour{firstName && `, ${firstName}`}
            </h1>
            <p className="text-md text-tertiary mt-1">
              Suivez l&apos;activité de votre programme de fidélité.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            <button
              type="button"
              aria-label="Notifications"
              className="size-10 inline-flex items-center justify-center rounded-lg bg-primary border border-secondary text-fg-secondary hover:bg-primary_hover transition-colors"
              onClick={() => router.push('/dashboard/notifications')}
            >
              <Bell01 className="size-5" />
            </button>
            <Button color="tertiary" size="md" iconLeading={Edit05} onClick={openManual}>
              <span className="hidden sm:inline">Saisie manuelle</span>
              <span className="sm:hidden">Manuel</span>
            </Button>
            <Button color="secondary" size="md" iconLeading={Download01} onClick={() => router.push('/dashboard/clients?action=export')}>
              <span className="hidden sm:inline">Exporter</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <Button color="primary" size="md" iconLeading={QrCode01} onClick={() => setScannerOpen(true)}>
              <span className="hidden sm:inline">Scanner client</span>
              <span className="sm:hidden">Scanner</span>
            </Button>
          </div>
        </div>

        {/* Section : Visites hebdo + Code commerce */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 rounded-xl bg-primary border border-secondary p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-primary">Visites hebdomadaires</h2>
            </div>
            {weekData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={weekData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAECF0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#667085' }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#667085' }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #EAECF0', fontSize: '13px' }}
                    labelStyle={{ fontWeight: 600 }}
                    formatter={(v) => [v, 'Visites']}
                  />
                  <Bar dataKey="count" fill="#7F56D9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-quaternary text-sm">
                Aucune donnée de visite cette semaine.
              </div>
            )}
          </div>

          <div className="lg:col-span-4 rounded-xl bg-primary border border-secondary p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-primary mb-4">Code commerce</h2>
            <div className="flex flex-col items-center text-center flex-1">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="size-32 rounded-lg" />
              ) : (
                <div className="size-32 rounded-lg bg-secondary animate-pulse" />
              )}
              <button
                onClick={copyShortCode}
                className="mt-4 inline-flex items-center gap-2 text-sm font-mono font-semibold text-primary hover:text-brand-secondary transition-colors"
              >
                <span className="tracking-wider">{business.short_code ?? '—'}</span>
                {codeCopied ? <CheckDone01 className="size-4 text-success-primary" /> : <Copy01 className="size-4" />}
              </button>
              <p className="mt-3 text-xs text-tertiary break-all">
                {typeof window !== 'undefined'
                  ? `${window.location.origin}/join/${business.short_code ?? ''}`
                  : `/join/${business.short_code ?? ''}`}
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                color="primary"
                size="sm"
                className="flex-1"
                iconLeading={pdfLoading ? Loading01 : Download01}
                isDisabled={pdfLoading}
                onClick={handleDownloadPdf}
              >
                {pdfLoading ? 'Préparation...' : 'PDF'}
              </Button>
              <Button color="secondary" size="sm" className="flex-1" iconLeading={linkCopied ? CheckDone01 : Copy01} onClick={copyJoinLink}>
                {linkCopied ? 'Copié' : 'Lien'}
              </Button>
            </div>
          </div>
        </div>

        {/* KPIs principaux row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Clients inscrits" value={clientsTotal} />
          <StatCard label="Visites du mois" value={visitsCount} />
          <StatCard label={distributedLabel} value={kpis?.distributedMonth ?? 0} />
          <StatCard label="Taux de retour" value={kpis ? `${kpis.tauxRetour}%` : '—'} />
        </div>

        {/* KPIs row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Clients actifs" value={kpis?.clientsActifs ?? 0} deltaLabel="< 30 jours" />
          <StatCard label="Clients à risque" value={kpis?.clientsInactifs ?? 0} deltaLabel="20-60 jours" emphasis="warning" />
          <StatCard label="Clients perdus" value={kpis?.clientsPerdus ?? 0} deltaLabel="> 60 jours" emphasis="danger" />
        </div>

        {/* Top 3 clients + Activites recentes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Top 3 clients */}
          <div className="lg:col-span-4 rounded-xl bg-primary border border-secondary p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy01 className="size-5 text-warning-primary" />
              <h2 className="text-lg font-semibold text-primary">Top 3 clients</h2>
            </div>
            {topClients.length === 0 ? (
              <p className="text-quaternary text-sm py-8 text-center">Aucun client encore.</p>
            ) : (
              <ul className="space-y-2">
                {topClients.slice(0, 3).map((c, i) => {
                  const rankEmoji = TOP_RANK_EMOJIS[i]
                  return (
                    <li
                      key={c.id}
                      onClick={() => router.push(`/dashboard/clients/${c.id}`)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary_hover cursor-pointer transition-colors"
                    >
                      <span className="w-6 flex justify-center">
                        {rankEmoji && <Emoji name={rankEmoji} size={20} />}
                      </span>
                      <div className="size-8 bg-brand-secondary rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-fg-brand-primary">
                          {c.customers?.first_name?.[0]?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate">
                          {c.customers?.first_name ?? 'Client'}
                        </p>
                        <p className="text-xs text-tertiary">
                          {c.total_visits} visite{c.total_visits !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Activites recentes */}
          <div className="lg:col-span-8 rounded-xl bg-primary border border-secondary overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-secondary">
              <h2 className="text-lg font-semibold text-primary">Activités récentes</h2>
            </div>
            {recentScans.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-tertiary text-sm">Aucun scan pour l&apos;instant.</p>
                <p className="text-quaternary text-xs mt-1">Les passages de vos clients apparaîtront ici.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary">
                    <th className="text-left text-xs font-medium text-tertiary uppercase tracking-wide px-6 py-3">Nom</th>
                    <th className="text-left text-xs font-medium text-tertiary uppercase tracking-wide px-6 py-3">Date</th>
                    <th className="text-right text-xs font-medium text-tertiary uppercase tracking-wide px-6 py-3">
                      {isStamps ? 'Tampons' : 'Points'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.map((scan) => {
                    const value = isStamps ? `+${scan.stamps_added ?? 0} tampon` : `+${scan.points_added ?? 0} pts`
                    return (
                      <tr key={scan.id} className="border-b border-secondary last:border-0 hover:bg-primary_hover transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-8 bg-brand-secondary rounded-full flex items-center justify-center shrink-0">
                              <span className="text-xs font-semibold text-fg-brand-primary">
                                {scan.loyalty_cards?.customers?.first_name?.[0]?.toUpperCase() ?? '?'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-primary">
                                {scan.loyalty_cards?.customers?.first_name ?? 'Client inconnu'}
                              </p>
                              <p className="text-xs text-tertiary">
                                {scan.loyalty_cards?.customers?.phone ?? ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-tertiary">
                          {formatRelativeDay(scan.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-brand-secondary">
                          {value}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scanner modal */}
      {scannerOpen && (
        <QrScanner onClose={() => setScannerOpen(false)} onSuccess={handleScanSuccess} />
      )}

      {/* Saisie manuelle modal */}
      {manualOpen && (
        <div className="fixed inset-0 bg-overlay/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-primary rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-secondary">
              <h2 className="text-base font-semibold text-primary">Saisie manuelle</h2>
              <button
                onClick={closeManual}
                className="text-tertiary hover:text-primary transition-colors p-1 rounded-md hover:bg-secondary"
              >
                <XIcon className="size-5" />
              </button>
            </div>

            <div className="p-6">
              {manualState.status === 'idle' && (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <p className="text-sm text-tertiary">
                    Saisissez le code court du client (ex&nbsp;: <span className="font-mono font-semibold text-primary">A1B2-C3D4</span>) ou son identifiant complet.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1.5">Code fidélité</label>
                    <input
                      type="text"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      autoFocus
                      required
                      placeholder="Code court ou ID complet…"
                      className="w-full px-4 py-2.5 border border-primary rounded-lg text-sm font-mono bg-primary text-primary placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <Button color="secondary" size="md" className="flex-1" type="button" onClick={closeManual}>
                      Annuler
                    </Button>
                    <Button color="primary" size="md" className="flex-1" type="submit" isDisabled={!manualInput.trim()}>
                      Valider
                    </Button>
                  </div>
                </form>
              )}

              {manualState.status === 'processing' && (
                <div className="py-10 text-center">
                  <Loading01 className="size-12 text-brand-secondary mx-auto mb-4 animate-spin" />
                  <p className="text-tertiary text-sm">Traitement en cours...</p>
                </div>
              )}

              {manualState.status === 'success' && (
                <div className="py-8 text-center">
                  <div className="size-16 bg-success-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckDone01 className="size-8 text-fg-success-primary" />
                  </div>
                  <p className="text-primary font-semibold text-base">{manualState.message}</p>
                  <Button color="primary" size="md" className="mt-5" onClick={closeManual}>
                    Fermer
                  </Button>
                </div>
              )}

              {manualState.status === 'error' && (
                <div className="py-8 text-center">
                  <div className="size-16 bg-error-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <XIcon className="size-8 text-fg-error-primary" />
                  </div>
                  <p className="text-secondary font-medium text-sm">{manualState.message}</p>
                  <div className="flex gap-3 mt-5 justify-center">
                    <Button color="primary" size="md" onClick={() => setManualState({ status: 'idle' })}>Réessayer</Button>
                    <Button color="secondary" size="md" onClick={closeManual}>Fermer</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
