'use client'

/**
 * Push notifications — Story 5.2 (Figma H1 + I1b).
 *
 * Vue par defaut : LISTE/HISTORIQUE des notifications envoyees + bouton "+ Nouvelle".
 * Le bouton ouvre le formulaire de creation en mode side-panel/inline.
 *
 * Statuts : sent | scheduled | draft | failed
 *
 * Note technique sur le taux d'ouverture (decision 2026-04-26) :
 * Web Push n'expose pas le taux d'affichage via l'API standard. On peut tracker
 * le clic (via service worker + endpoint), pas l'affichage. En v1 on affiche
 * uniquement le nombre d'envois ; le taux d'ouverture sera ajoute si on bouge
 * vers Firebase Cloud Messaging avec analytics.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  Rocket01,
  Bell01,
  CheckDone01,
  AlertCircle,
  Loading01,
  X as XIcon,
  AlertTriangle,
  Plus,
  Copy01,
  Trash01,
  Mail02,
  Clock,
  ArrowLeft,
} from '@untitledui/icons'
import { Button } from '@/components/ui/base/buttons/button'
import { Input } from '@/components/ui/base/input/input'
import { Toggle } from '@/components/ui/base/toggle/toggle'
import { Emoji, type EmojiName } from '@/lib/emojis'
import { createClient } from '@/lib/supabase/client'
import type { Business } from '@/lib/types'
import { cx } from '@/utils/cx'
import type { PushBroadcast } from './page'

const TITLE_MAX = 50
const BODY_MAX = 100

interface PushTemplate {
  iconName: EmojiName
  label: string
  title: string
  body: string
}

const TEMPLATES: PushTemplate[] = [
  { iconName: 'gift', label: 'Promotion', title: 'Promotion du jour', body: '−20 % sur toute la carte aujourd\'hui. À ce soir !' },
  { iconName: 'coffee', label: 'Café offert', title: 'Une boisson vous attend', body: 'Votre carte de fidélité est complète. Venez chercher votre récompense !' },
  { iconName: 'clock', label: 'On vous a manqué', title: 'Ça fait longtemps...', body: 'On serait ravis de vous revoir. Une boisson offerte si vous passez avant samedi.' },
  { iconName: 'confetti', label: 'Nouveauté', title: 'Nouveauté à découvrir', body: 'On vient d\'ajouter quelque chose de spécial à la carte. Venez goûter !' },
]

interface PushClientProps {
  business: Business
  initialBroadcasts: PushBroadcast[]
}

type View = 'list' | 'compose'
type Tab = 'all' | 'sent' | 'scheduled'

type SendState =
  | { status: 'idle' }
  | { status: 'confirming' }
  | { status: 'sending' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export default function PushClient({ business, initialBroadcasts }: PushClientProps) {
  const [view, setView] = useState<View>('list')
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [broadcasts, setBroadcasts] = useState<PushBroadcast[]>(initialBroadcasts)
  const [subscribers, setSubscribers] = useState<number | null>(null)

  // Compose form state
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduledAt, setScheduledAt] = useState<string>('') // datetime-local format
  const [send, setSend] = useState<SendState>({ status: 'idle' })

  useEffect(() => {
    fetch('/api/push/broadcast')
      .then((r) => r.json())
      .then((data) => { if (typeof data.count === 'number') setSubscribers(data.count) })
      .catch(() => setSubscribers(0))
  }, [])

  const filteredBroadcasts = useMemo(() => {
    let list = broadcasts
    if (tab === 'sent') list = list.filter((b) => b.status === 'sent')
    if (tab === 'scheduled') list = list.filter((b) => b.status === 'scheduled')
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((b) => b.title.toLowerCase().includes(q) || b.body.toLowerCase().includes(q))
    }
    return list
  }, [broadcasts, tab, search])

  const titleRemaining = TITLE_MAX - title.length
  const bodyRemaining = BODY_MAX - body.length
  const canSend = title.trim().length > 0 && body.trim().length > 0 && titleRemaining >= 0 && bodyRemaining >= 0

  function applyTemplate(t: typeof TEMPLATES[number]) {
    setTitle(t.title.slice(0, TITLE_MAX))
    setBody(t.body.slice(0, BODY_MAX))
  }

  function reuse(b: PushBroadcast) {
    setTitle(b.title.slice(0, TITLE_MAX))
    setBody(b.body.slice(0, BODY_MAX))
    setView('compose')
    setSend({ status: 'idle' })
  }

  async function deleteBroadcast(id: string) {
    if (!confirm('Supprimer cette notification de l\'historique ?')) return
    const supabase = createClient()
    const { error } = await supabase.from('push_broadcasts').delete().eq('id', id)
    if (!error) {
      setBroadcasts((curr) => curr.filter((b) => b.id !== id))
    }
  }

  async function doSend() {
    setSend({ status: 'sending' })
    const scheduledIso = scheduleEnabled && scheduledAt ? new Date(scheduledAt).toISOString() : null
    try {
      const res = await fetch('/api/push/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          scheduledAt: scheduledIso,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSend({ status: 'error', message: data.error?.message ?? data.error ?? 'Erreur lors de l\'envoi' })
        return
      }
      setSend({ status: 'success' })
      const isScheduled = !!data.scheduled
      setBroadcasts((curr) => [{
        id: data.id ?? crypto.randomUUID(),
        title: title.trim(),
        body: body.trim(),
        recipient_count: isScheduled ? 0 : (data.recipientCount ?? subscribers ?? 0),
        status: isScheduled ? 'scheduled' : 'sent',
        scheduled_at: scheduledIso,
        sent_at: new Date().toISOString(),
      }, ...curr])
      setTitle('')
      setBody('')
      setScheduleEnabled(false)
      setScheduledAt('')

      // Story 9.x.fix 2026-05-10 : marque la tâche notif_setup de la checklist
      // d'onboarding comme done. L'envoi d'une push notification est l'action
      // attendue pour cocher cette tâche, mais avant ce fix, aucun appel API
      // n'était fait → tâche restait non cochée même après envoi.
      // Idempotent : safe à ré-appeler à chaque envoi.
      fetch('/api/business/onboarding/notif-setup', { method: 'POST' }).catch(() => {})
    } catch (err) {
      setSend({ status: 'error', message: err instanceof Error ? err.message : 'Erreur réseau' })
    }
  }

  async function cancelScheduled(id: string) {
    if (!confirm('Annuler cette notification programmée ?')) return
    const supabase = createClient()
    const { error } = await supabase.from('push_broadcasts').delete().eq('id', id)
    if (!error) {
      setBroadcasts((curr) => curr.filter((b) => b.id !== id))
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex items-start justify-between gap-3 sm:block">
          <div className="min-w-0">
            <h1 className="text-display-xs sm:text-display-sm font-semibold text-primary">
              Push notifications
            </h1>
            <p className="text-sm sm:text-md text-tertiary mt-1">
              Envoyez des notifications push à vos clients abonnés.
            </p>
          </div>
          <div className="sm:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-secondary/40 border border-brand/30 shrink-0">
            <Bell01 className="size-3.5 text-fg-brand-primary" />
            <span className="text-xs font-medium text-fg-brand-primary whitespace-nowrap">
              {subscribers === null ? '…' : subscribers}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-secondary/40 border border-brand/30">
            <Bell01 className="size-4 text-fg-brand-primary" />
            <span className="text-sm font-medium text-fg-brand-primary">
              {subscribers === null ? '…' : subscribers}{' '}
              {subscribers === 1 ? 'abonné' : 'abonnés'}
            </span>
          </div>
          {view === 'list' ? (
            <Button
              data-tour="push-create"
              color="primary"
              size="md"
              iconLeading={Plus}
              className="flex-1 sm:flex-none"
              onClick={() => { setSend({ status: 'idle' }); setView('compose') }}
            >
              Nouvelle
            </Button>
          ) : (
            <Button color="secondary" size="md" onClick={() => setView('list')}>
              Voir l&apos;historique
            </Button>
          )}
        </div>
      </div>

      {view === 'list' ? (
        <ListView
          broadcasts={filteredBroadcasts}
          totalCount={broadcasts.length}
          tab={tab}
          onTabChange={setTab}
          search={search}
          onSearchChange={setSearch}
          onReuse={reuse}
          onDelete={deleteBroadcast}
          onCompose={() => setView('compose')}
        />
      ) : (
        <ComposeView
          business={business}
          subscribers={subscribers}
          title={title}
          setTitle={setTitle}
          body={body}
          setBody={setBody}
          titleRemaining={titleRemaining}
          bodyRemaining={bodyRemaining}
          canSend={canSend}
          applyTemplate={applyTemplate}
          scheduleEnabled={scheduleEnabled}
          setScheduleEnabled={setScheduleEnabled}
          scheduledAt={scheduledAt}
          setScheduledAt={setScheduledAt}
          onBack={() => setView('list')}
          onSend={() => setSend({ status: 'confirming' })}
        />
      )}

      {/* Modals */}
      {send.status === 'confirming' && (
        <ConfirmModal
          subscribers={subscribers ?? 0}
          title={title}
          body={body}
          onCancel={() => setSend({ status: 'idle' })}
          onConfirm={doSend}
        />
      )}

      {send.status === 'sending' && (
        <Overlay>
          <div className="bg-primary rounded-2xl p-8 text-center max-w-sm">
            <Loading01 className="size-12 text-brand-secondary mx-auto mb-4 animate-spin" />
            <p className="text-primary font-semibold">Envoi en cours...</p>
            <p className="text-sm text-tertiary mt-1">
              Diffusion à {subscribers ?? 0} {subscribers === 1 ? 'abonné' : 'abonnés'}
            </p>
          </div>
        </Overlay>
      )}

      {send.status === 'success' && (
        <Overlay>
          <div className="relative bg-primary rounded-2xl p-8 text-center max-w-sm">
            {/* Story 9.x.fix 2026-05-10 : X close button — avant la modal
                forçait à choisir entre Nouvelle/Historique pour partir. */}
            <button
              type="button"
              onClick={() => setSend({ status: 'idle' })}
              aria-label="Fermer"
              className="absolute top-3 right-3 size-8 rounded-full hover:bg-secondary inline-flex items-center justify-center text-quaternary hover:text-primary transition-colors"
            >
              <XIcon className="size-4" />
            </button>
            <div className="size-14 mx-auto mb-4 bg-success-secondary rounded-full flex items-center justify-center">
              <CheckDone01 className="size-7 text-fg-success-primary" />
            </div>
            <p className="text-primary font-semibold text-lg">Notification envoyée</p>
            <p className="text-sm text-tertiary mt-1">
              {subscribers ?? 0} {subscribers === 1 ? 'abonné a' : 'abonnés ont'} reçu votre message.
            </p>
            <div className="flex gap-3 mt-5">
              <Button color="secondary" size="md" className="flex-1" onClick={() => setSend({ status: 'idle' })}>
                Nouvelle notif
              </Button>
              <Button color="primary" size="md" className="flex-1" onClick={() => { setSend({ status: 'idle' }); setView('list') }}>
                Voir l&apos;historique
              </Button>
            </div>
          </div>
        </Overlay>
      )}

      {send.status === 'error' && (
        <Overlay>
          <div className="bg-primary rounded-2xl p-8 text-center max-w-sm">
            <div className="size-14 mx-auto mb-4 bg-error-secondary rounded-full flex items-center justify-center">
              <AlertCircle className="size-7 text-fg-error-primary" />
            </div>
            <p className="text-primary font-semibold text-lg">Erreur d&apos;envoi</p>
            <p className="text-sm text-tertiary mt-1">{send.message}</p>
            <div className="flex gap-3 mt-5">
              <Button color="secondary" size="md" className="flex-1" onClick={() => setSend({ status: 'idle' })}>
                Fermer
              </Button>
              <Button color="primary" size="md" className="flex-1" onClick={doSend}>
                Réessayer
              </Button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  )
}

// =====================================================================
// LIST VIEW
// =====================================================================

function ListView({
  broadcasts,
  totalCount,
  tab,
  onTabChange,
  search,
  onSearchChange,
  onReuse,
  onDelete,
  onCompose,
}: {
  broadcasts: PushBroadcast[]
  totalCount: number
  tab: Tab
  onTabChange: (t: Tab) => void
  search: string
  onSearchChange: (s: string) => void
  onReuse: (b: PushBroadcast) => void
  onDelete: (id: string) => void
  onCompose: () => void
}) {
  return (
    <div className="space-y-4">
      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex p-1 rounded-lg bg-secondary/60 border border-secondary">
          {([
            { id: 'all', label: 'Toutes' },
            { id: 'sent', label: 'Envoyées' },
            { id: 'scheduled', label: 'Programmées' },
          ] as const).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange(t.id)}
              className={cx(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                tab === t.id
                  ? 'bg-primary text-primary shadow-sm'
                  : 'text-tertiary hover:text-primary',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher une notification..."
          className="px-3.5 py-2 rounded-lg bg-primary border border-secondary text-sm placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-brand min-w-0 sm:min-w-[260px]"
        />
      </div>

      {/* Empty state */}
      {totalCount === 0 ? (
        <div className="rounded-xl bg-primary border border-secondary p-12 text-center">
          <div className="size-14 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <Mail02 className="size-7 text-fg-quaternary" />
          </div>
          <p className="text-primary font-semibold mb-1">Aucune notification envoyée</p>
          <p className="text-sm text-tertiary mb-5">
            Vos campagnes apparaîtront ici. Commencez par créer votre première notification.
          </p>
          <Button data-tour="push-create" color="primary" size="md" iconLeading={Plus} onClick={onCompose}>
            Créer ma première notification
          </Button>
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="rounded-xl bg-primary border border-secondary p-12 text-center">
          <p className="text-tertiary text-sm">Aucun résultat pour ces filtres.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-primary border border-secondary overflow-hidden">
          {/* Desktop table */}
          <table className="hidden md:table w-full">
            <thead>
              <tr className="bg-secondary/40 border-b border-secondary">
                <th className="text-left text-xs font-medium text-tertiary uppercase tracking-wide px-6 py-3">Notification</th>
                <th className="text-left text-xs font-medium text-tertiary uppercase tracking-wide px-6 py-3 whitespace-nowrap">Envois</th>
                <th className="text-left text-xs font-medium text-tertiary uppercase tracking-wide px-6 py-3 whitespace-nowrap">Date</th>
                <th className="text-left text-xs font-medium text-tertiary uppercase tracking-wide px-6 py-3 whitespace-nowrap">Statut</th>
                <th className="text-right text-xs font-medium text-tertiary uppercase tracking-wide px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {broadcasts.map((b) => (
                <tr key={b.id} className="border-b border-secondary last:border-0 hover:bg-primary_hover transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-primary">{b.title}</p>
                    <p className="text-xs text-tertiary line-clamp-1 mt-0.5">{b.body}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-tertiary whitespace-nowrap">
                    {b.status === 'scheduled' ? '—' : `${b.recipient_count} envoi${b.recipient_count !== 1 ? 's' : ''}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-tertiary whitespace-nowrap">
                    {b.status === 'scheduled' && b.scheduled_at ? (
                      <span className="inline-flex items-center gap-1.5 text-warning-primary font-medium">
                        <Clock className="size-3.5" />
                        {formatDateTime(b.scheduled_at)}
                      </span>
                    ) : (
                      formatDate(b.sent_at)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="inline-flex gap-1">
                      <button
                        type="button"
                        onClick={() => onReuse(b)}
                        className="px-2.5 py-1.5 rounded-md text-xs font-medium text-secondary hover:text-primary hover:bg-secondary inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Copy01 className="size-3.5" />
                        Réutiliser
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(b.id)}
                        aria-label="Supprimer"
                        className="size-8 inline-flex items-center justify-center rounded-md text-tertiary hover:text-error-primary hover:bg-error-secondary/40 transition-colors"
                      >
                        <Trash01 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <ul className="md:hidden divide-y divide-secondary">
            {broadcasts.map((b) => (
              <li key={b.id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="text-sm font-semibold text-primary truncate">{b.title}</p>
                  <StatusBadge status={b.status} />
                </div>
                <p className="text-xs text-tertiary line-clamp-2 mb-2">{b.body}</p>
                <div className="flex items-center justify-between gap-3 text-xs text-tertiary">
                  <span>
                    {b.status === 'scheduled' && b.scheduled_at ? (
                      <span className="inline-flex items-center gap-1 text-warning-primary font-medium">
                        <Clock className="size-3" />
                        Prévue le {formatDateTime(b.scheduled_at)}
                      </span>
                    ) : (
                      <>{b.recipient_count} envois · {formatDate(b.sent_at)}</>
                    )}
                  </span>
                  <div className="inline-flex gap-2">
                    <button
                      type="button"
                      onClick={() => onReuse(b)}
                      className="text-fg-brand-primary font-medium"
                    >
                      Réutiliser
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(b.id)}
                      aria-label="Supprimer"
                      className="text-error-primary"
                    >
                      <Trash01 className="size-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    sent: { label: 'Envoyée', bg: 'bg-success-secondary/40', text: 'text-success-primary', dot: 'bg-success-primary' },
    scheduled: { label: 'Programmée', bg: 'bg-warning-secondary/40', text: 'text-warning-primary', dot: 'bg-warning-primary' },
    failed: { label: 'Échec', bg: 'bg-error-secondary/40', text: 'text-error-primary', dot: 'bg-error-primary' },
    draft: { label: 'Brouillon', bg: 'bg-secondary', text: 'text-tertiary', dot: 'bg-quaternary' },
  }
  const c = config[status] ?? config.sent
  return (
    <span className={cx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', c.bg, c.text)}>
      <span className={cx('size-1.5 rounded-full', c.dot)} />
      {c.label}
    </span>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return `Aujourd'hui ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  if (d.toDateString() === yesterday.toDateString()) return `Hier ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' })
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === today.toDateString()) return `Aujourd'hui à ${time}`
  if (d.toDateString() === tomorrow.toDateString()) return `Demain à ${time}`
  return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${time}`
}

// =====================================================================
// COMPOSE VIEW
// =====================================================================

function ComposeView({
  business,
  subscribers,
  title,
  setTitle,
  body,
  setBody,
  titleRemaining,
  bodyRemaining,
  canSend,
  applyTemplate,
  scheduleEnabled,
  setScheduleEnabled,
  scheduledAt,
  setScheduledAt,
  onBack,
  onSend,
}: {
  business: Business
  subscribers: number | null
  title: string
  setTitle: (s: string) => void
  body: string
  setBody: (s: string) => void
  titleRemaining: number
  bodyRemaining: number
  canSend: boolean
  applyTemplate: (t: typeof TEMPLATES[number]) => void
  scheduleEnabled: boolean
  setScheduleEnabled: (v: boolean) => void
  scheduledAt: string
  setScheduledAt: (v: string) => void
  onBack: () => void
  onSend: () => void
}) {
  // Min datetime = now + 5 min, format YYYY-MM-DDTHH:MM
  /* eslint-disable react-hooks/purity -- Date.now() lecture systeme : OK pour calcul d'un MIN affichage (idempotent par render mais reference temporelle live attendue). Le useMemo capture la valeur initiale, on accepte qu'elle se decale avec le temps reel. */
  const minDateTime = useMemo(() => {
    const d = new Date(Date.now() + 5 * 60 * 1000)
    const tzOffset = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
  }, [])
  const scheduledOk = !scheduleEnabled || (scheduledAt && new Date(scheduledAt).getTime() > Date.now())
  /* eslint-enable react-hooks/purity */
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-brand-primary hover:text-fg-brand-primary_hover transition-colors"
      >
        <ArrowLeft className="size-4" />
        Retour à l&apos;historique
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 space-y-6">
        <section
          data-tour="push-templates"
          className="rounded-xl bg-primary border border-secondary p-5 sm:p-6"
        >
          <h2 className="text-sm font-semibold text-primary mb-3">Modèles rapides</h2>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => applyTemplate(t)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-secondary bg-primary text-secondary hover:bg-primary_hover transition-colors inline-flex items-center gap-1.5"
              >
                <Emoji name={t.iconName} size={14} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section
          data-tour="push-config"
          className="rounded-xl bg-primary border border-secondary p-5 sm:p-6 space-y-5"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-secondary">Titre</label>
              <span className={`text-xs ${titleRemaining < 0 ? 'text-error-primary' : 'text-tertiary'}`}>
                {titleRemaining}
              </span>
            </div>
            <Input
              value={title}
              onChange={(v) => setTitle(v.slice(0, TITLE_MAX + 10))}
              placeholder="Ex : Une boisson vous attend"
              isInvalid={titleRemaining < 0}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-secondary">Message</label>
              <span className={`text-xs ${bodyRemaining < 0 ? 'text-error-primary' : 'text-tertiary'}`}>
                {bodyRemaining}
              </span>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX + 10))}
              placeholder="Ex : Votre carte de fidélité est complète. Venez chercher votre récompense !"
              rows={3}
              className={`w-full px-3 py-2 rounded-lg text-md text-primary bg-primary placeholder:text-placeholder ring-1 ring-inset transition-shadow ${bodyRemaining < 0 ? 'ring-error_subtle focus:ring-2 focus:ring-error' : 'ring-primary focus:ring-2 focus:ring-brand'} outline-none resize-none`}
            />
          </div>

          {/* Programmation */}
          <div className="rounded-lg border border-secondary bg-secondary/20 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <label className="text-sm font-medium text-primary">Programmer l&apos;envoi</label>
                <p className="text-xs text-tertiary mt-0.5">
                  Choisissez une date et une heure futures. Sinon, l&apos;envoi sera immédiat.
                </p>
              </div>
              <Toggle isSelected={scheduleEnabled} onChange={setScheduleEnabled} aria-label="Activer la programmation" />
            </div>
            {scheduleEnabled && (
              <input
                type="datetime-local"
                value={scheduledAt}
                min={minDateTime}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-md text-primary bg-primary placeholder:text-placeholder ring-1 ring-inset ring-primary focus:ring-2 focus:ring-brand outline-none"
              />
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-xs text-tertiary">Limite : 5 envois par heure</p>
            <Button
              data-tour="push-send"
              color="primary"
              size="md"
              iconLeading={scheduleEnabled ? Clock : Rocket01}
              isDisabled={!canSend || !scheduledOk || subscribers === 0}
              onClick={onSend}
            >
              {scheduleEnabled ? 'Programmer' : 'Envoyer'}
            </Button>
          </div>

          {subscribers === 0 && (
            <div className="rounded-lg bg-warning-secondary/40 border border-warning-subtle p-3 flex items-start gap-2.5">
              <AlertTriangle className="size-4 text-warning-primary shrink-0 mt-0.5" />
              <p className="text-xs text-warning-primary">
                Vous n&apos;avez pas encore d&apos;abonnés. Vos clients recevront vos notifications une fois qu&apos;ils auront accepté les notifications dans leur carte de fidélité.
              </p>
            </div>
          )}
        </section>
      </div>

      <aside className="lg:col-span-5 lg:sticky lg:top-6 self-start">
        <div className="rounded-xl bg-secondary/40 border border-secondary p-5 sm:p-6">
          <p className="text-xs font-semibold text-tertiary uppercase tracking-wide mb-4">
            Aperçu mobile
          </p>
          <NotificationPreview
            businessName={business.business_name}
            title={title || 'Titre de la notification'}
            body={body || 'Le contenu de votre message apparaîtra ici en temps réel.'}
          />
        </div>
      </aside>
      </div>
    </div>
  )
}

function NotificationPreview({ businessName, title, body }: { businessName: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-gray-100 dark:bg-gray-800 p-3 max-w-sm mx-auto">
      <div className="rounded-xl bg-white dark:bg-gray-900 shadow-md p-3.5 flex items-start gap-3">
        <div className="size-9 rounded-lg bg-brand-solid flex items-center justify-center shrink-0">
          <Bell01 className="size-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
              {businessName || 'Votre commerce'}
            </p>
            <span className="text-[10px] text-gray-500 shrink-0">à l&apos;instant</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</p>
          <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 mt-0.5">{body}</p>
        </div>
      </div>
      <p className="text-[10px] text-tertiary text-center mt-2">
        Aperçu indicatif. Le rendu final dépend du téléphone du client.
      </p>
    </div>
  )
}

// =====================================================================
// MODALS
// =====================================================================

function ConfirmModal({ subscribers, title, body, onCancel, onConfirm }: {
  subscribers: number; title: string; body: string; onCancel: () => void; onConfirm: () => void
}) {
  return (
    <Overlay>
      <div className="bg-primary rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-secondary">
          <h2 className="text-base font-semibold text-primary">Confirmer l&apos;envoi</h2>
          <button onClick={onCancel} className="text-tertiary hover:text-primary transition-colors p-1 rounded-md hover:bg-secondary">
            <XIcon className="size-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-secondary">
            Vous êtes sur le point d&apos;envoyer cette notification à{' '}
            <strong className="text-primary">{subscribers}</strong>{' '}
            {subscribers === 1 ? 'abonné' : 'abonnés'}.
          </p>
          <div className="rounded-lg bg-secondary/40 border border-secondary p-4 space-y-1">
            <p className="text-sm font-semibold text-primary">{title}</p>
            <p className="text-sm text-tertiary">{body}</p>
          </div>
          <div className="flex gap-3">
            <Button color="secondary" size="md" className="flex-1" onClick={onCancel}>Annuler</Button>
            <Button color="primary" size="md" className="flex-1" onClick={onConfirm}>Envoyer maintenant</Button>
          </div>
        </div>
      </div>
    </Overlay>
  )
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-overlay/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {children}
    </div>
  )
}
