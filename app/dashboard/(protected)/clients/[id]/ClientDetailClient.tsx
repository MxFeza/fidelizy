'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Business, Customer, LoyaltyCard, Transaction, RewardTier } from '@/lib/types'

type ClientCard = LoyaltyCard & { customers: Customer }

interface Props {
  card: ClientCard
  business: Business
  transactions: Transaction[]
  rewardTiers: RewardTier[]
}

function formatDate(ds: string) {
  return new Date(ds).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function relativeDate(ds: string | null) {
  if (!ds) return 'Jamais'
  const days = Math.floor((Date.now() - new Date(ds).getTime()) / 86400000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} jours`
  if (days < 30) return `Il y a ${Math.floor(days / 7)} semaine${Math.floor(days / 7) > 1 ? 's' : ''}`
  if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`
  return `Il y a ${Math.floor(days / 365)} an${Math.floor(days / 365) > 1 ? 's' : ''}`
}

export default function ClientDetailClient({ card, business, transactions, rewardTiers }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [addAmount, setAddAmount] = useState<number | ''>(1)
  const [deducting, setDeducting] = useState(false)
  const [deductAmount, setDeductAmount] = useState<number | ''>(1)
  const [resetting, setResetting] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [showClaimReward, setShowClaimReward] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [cooldown, setCooldown] = useState(false)
  const color = business.primary_color || '#4f46e5'
  const stampsRequired = business.stamps_required ?? 10
  const currentStamps = Math.min(card.current_stamps ?? 0, stampsRequired)
  const stampCols = stampsRequired <= 5 ? stampsRequired : stampsRequired % 4 === 0 ? 4 : 5

  async function handleAdd(amount: number | '', type: 'stamps' | 'points') {
    if (amount === '' || amount <= 0) return
    setAdding(true)
    setCooldown(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/card/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: card.id, type, amount }),
      })
      const data = await res.json()
      if (data.success) {
        setFeedback({ type: 'success', message: data.message })
        setAddAmount(1)
        router.refresh()
      } else {
        setFeedback({ type: 'error', message: data.error ?? 'Erreur lors du traitement.' })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erreur de connexion. Veuillez réessayer.' })
    }
    setAdding(false)
    setTimeout(() => setCooldown(false), 2000)
  }

  async function handleDeduct(amount: number | '', type: 'stamps' | 'points') {
    if (amount === '' || amount <= 0) return
    setDeducting(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/card/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: card.id, type, amount }),
      })
      const data = await res.json()
      if (data.success) {
        setFeedback({
          type: 'success',
          message:
            type === 'stamps'
              ? `${amount} tampon${amount > 1 ? 's' : ''} retiré${amount > 1 ? 's' : ''}.`
              : `${amount} point${amount > 1 ? 's' : ''} retirés.`,
        })
        setDeductAmount(1)
        router.refresh()
      } else {
        setFeedback({ type: 'error', message: data.error ?? 'Erreur lors du retrait.' })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erreur de connexion. Veuillez réessayer.' })
    }
    setDeducting(false)
  }

  async function handleReset() {
    setResetting(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/card/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: card.id }),
      })
      const data = await res.json()
      if (data.success) {
        setFeedback({ type: 'success', message: 'Carte réinitialisée avec succès. La récompense a été enregistrée.' })
        setConfirmReset(false)
        router.refresh()
      } else {
        setFeedback({ type: 'error', message: data.error ?? 'Erreur lors de la réinitialisation.' })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erreur de connexion. Veuillez réessayer.' })
    }
    setResetting(false)
  }

  async function handleClaimReward(tierId: string) {
    setClaiming(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/card/claim-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: card.id, reward_tier_id: tierId }),
      })
      const data = await res.json()
      if (data.success) {
        setFeedback({ type: 'success', message: data.message })
        setShowClaimReward(false)
        router.refresh()
      } else {
        setFeedback({ type: 'error', message: data.error ?? 'Erreur lors de la réclamation.' })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erreur de connexion. Veuillez réessayer.' })
    }
    setClaiming(false)
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => router.push('/dashboard/clients')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour aux clients
      </button>

      {/* Client header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 md:mb-8">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-indigo-700 font-bold text-lg md:text-2xl">
              {card.customers?.first_name?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{card.customers?.first_name ?? 'Client'}</h1>
            {card.customers?.phone && (
              <p className="text-gray-400 text-sm">{card.customers.phone}</p>
            )}
            {card.customers?.email && (
              <p className="text-gray-400 text-sm">{card.customers.email}</p>
            )}
          </div>
        </div>
        <div className="text-left sm:text-right shrink-0 pl-15 sm:pl-0">
          <p className="text-xs text-gray-400">Inscrit le</p>
          <p className="text-sm font-medium text-gray-600">
            {new Date(card.customers?.created_at ?? card.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium border ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="space-y-5" style={{ minHeight: 320 }}>
        {/* Stamp card visual */}
        {business.loyalty_type === 'stamps' && (
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)' }}
          >
            <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                    Carte à tampons
                  </p>
                  {currentStamps >= stampsRequired ? (
                    <p className="text-sm font-bold text-green-700">🎉 Récompense débloquée !</p>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Encore{' '}
                      <span className="font-bold" style={{ color }}>
                        {stampsRequired - currentStamps} tampon
                        {stampsRequired - card.current_stamps > 1 ? 's' : ''}
                      </span>{' '}
                      pour la récompense
                    </p>
                  )}
                </div>
                <div
                  className="w-12 h-12 rounded-full flex flex-col items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: currentStamps >= stampsRequired ? '#16a34a' : color }}
                >
                  <span className="text-lg font-black leading-none">{currentStamps}</span>
                  <span className="text-[9px] font-semibold leading-none opacity-75">/{stampsRequired}</span>
                </div>
              </div>

              <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${stampCols}, 1fr)` }}>
                {Array.from({ length: stampsRequired }).map((_, i) => {
                  const filled = i < currentStamps
                  return (
                    <div
                      key={i}
                      className="aspect-square rounded-full flex items-center justify-center transition-all"
                      style={
                        filled
                          ? { backgroundColor: color, boxShadow: `0 2px 6px ${color}55` }
                          : { backgroundColor: '#f9fafb', border: '2px dashed #e5e7eb' }
                      }
                    >
                      {filled ? (
                        <svg
                          className="text-white"
                          style={{ width: '52%', height: '52%' }}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          viewBox="0 0 24 24"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-xs text-gray-300 font-medium select-none">{i + 1}</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {business.stamps_reward && (
                <div
                  className="text-sm font-semibold text-center py-2.5 px-4 rounded-xl"
                  style={
                    currentStamps >= stampsRequired
                      ? { backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }
                      : { backgroundColor: `${color}12`, color, border: `1px solid ${color}28` }
                  }
                >
                  {currentStamps >= stampsRequired ? '🎁 Récompense disponible : ' : '🎯 '}
                  {business.stamps_reward}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Points display */}
        {business.loyalty_type === 'points' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Solde de points</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold" style={{ color }}>{card.current_points ?? 0}</span>
              <span className="text-gray-400 text-sm">points cumulés</span>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-100 text-center">
            <p className="text-xl md:text-2xl font-bold text-gray-900">{card.total_visits ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">Visites</p>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-100 text-center">
            <p className="text-xl md:text-2xl font-bold" style={{ color }}>
              {business.loyalty_type === 'stamps' ? currentStamps : card.current_points}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {business.loyalty_type === 'stamps' ? 'Tampons' : 'Points'}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-100 text-center">
            <p className="text-xs md:text-sm font-semibold text-gray-700 leading-snug">
              {relativeDate(card.last_visit_at)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Dern. visite</p>
          </div>
        </div>

        {/* Add stamps/points */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
          <span className="text-sm text-indigo-800 font-medium shrink-0">Ajouter</span>
          <input
            type="number"
            min={1}
            max={business.loyalty_type === 'stamps' ? stampsRequired : 9999}
            value={addAmount === '' ? '' : addAmount}
            onChange={(e) => {
              const v = e.target.value
              setAddAmount(v === '' ? '' : Math.max(1, Number(v)))
            }}
            onBlur={() => { if (addAmount === '') setAddAmount(1) }}
            className="w-20 px-3 py-2 border border-indigo-200 rounded-lg text-sm text-center bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <span className="text-sm text-indigo-800 font-medium shrink-0">
            {business.loyalty_type === 'stamps'
              ? `tampon${addAmount !== '' && addAmount > 1 ? 's' : ''}`
              : `point${addAmount !== '' && addAmount > 1 ? 's' : ''}`}
          </span>
          <button
            onClick={() => handleAdd(addAmount, business.loyalty_type as 'stamps' | 'points')}
            disabled={adding || cooldown || addAmount === ''}
            className="ml-auto px-4 py-2.5 min-h-[48px] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {adding ? 'Ajout…' : 'Ajouter'}
          </button>
        </div>

        {/* Deduct stamps/points */}
        {((business.loyalty_type === 'stamps' && currentStamps > 0) ||
          (business.loyalty_type === 'points' && (card.current_points ?? 0) > 0)) && (
          <div className="flex flex-wrap items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-2xl">
            <span className="text-sm text-orange-800 font-medium shrink-0">Retirer</span>
            <input
              type="number"
              min={1}
              max={business.loyalty_type === 'stamps' ? currentStamps : (card.current_points ?? 0)}
              value={deductAmount === '' ? '' : deductAmount}
              onChange={(e) => {
                const v = e.target.value
                setDeductAmount(v === '' ? '' : Math.max(1, Number(v)))
              }}
              onBlur={() => { if (deductAmount === '') setDeductAmount(1) }}
              className="w-20 px-3 py-2 border border-orange-200 rounded-lg text-sm text-center bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <span className="text-sm text-orange-800 font-medium shrink-0">
              {business.loyalty_type === 'stamps'
                ? `tampon${deductAmount !== '' && deductAmount > 1 ? 's' : ''}`
                : `point${deductAmount !== '' && deductAmount > 1 ? 's' : ''}`}
            </span>
            <button
              onClick={() => handleDeduct(deductAmount, business.loyalty_type as 'stamps' | 'points')}
              disabled={deducting || deductAmount === ''}
              className="ml-auto px-4 py-2.5 min-h-[48px] bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              {deducting ? '…' : 'Retirer'}
            </button>
          </div>
        )}

        {/* Reset (stamps only) */}
        {business.loyalty_type === 'stamps' && currentStamps > 0 && !confirmReset && (
          <button
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-2 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-600 hover:text-red-600 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Réinitialiser la carte
          </button>
        )}

        {/* Reset confirmation */}
        {confirmReset && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <p className="font-semibold text-red-800 text-sm mb-1">Réinitialiser la carte ?</p>
            <p className="text-red-600 text-xs mb-4">
              Les tampons seront remis à 0 et la récompense sera marquée comme accordée. Action irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                disabled={resetting}
                className="px-4 py-2.5 min-h-[48px] bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {resetting ? 'Réinitialisation…' : 'Confirmer'}
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-4 py-2.5 min-h-[48px] border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Claim reward (points only) */}
        {business.loyalty_type === 'points' && rewardTiers.length > 0 && (
          <>
            {!showClaimReward ? (
              <button
                onClick={() => setShowClaimReward(true)}
                className="flex items-center gap-2 bg-white hover:bg-green-50 border border-gray-200 hover:border-green-200 text-gray-600 hover:text-green-700 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                Utiliser une récompense
              </button>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-green-800 text-sm">Choisir une récompense</p>
                  <button
                    onClick={() => setShowClaimReward(false)}
                    className="text-green-400 hover:text-green-700 text-sm"
                  >
                    Annuler
                  </button>
                </div>
                <p className="text-xs text-green-600">
                  Solde actuel : <span className="font-bold">{card.current_points ?? 0} pts</span>
                </p>
                <div className="space-y-2">
                  {rewardTiers.map((tier) => {
                    const canAfford = (card.current_points ?? 0) >= tier.points_required
                    return (
                      <div
                        key={tier.id}
                        className={`flex items-center justify-between p-3 rounded-xl border ${
                          canAfford
                            ? 'bg-white border-green-200'
                            : 'bg-gray-50 border-gray-100 opacity-60'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${canAfford ? 'text-gray-900' : 'text-gray-500'}`}>
                            {tier.reward_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {tier.points_required} pts
                            {tier.reward_description && ` — ${tier.reward_description}`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleClaimReward(tier.id)}
                          disabled={!canAfford || claiming}
                          className="shrink-0 ml-3 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          {claiming ? '…' : 'Accorder'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Full transaction history */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <p className="font-semibold text-gray-900">Historique des transactions</p>
            <span className="text-xs text-gray-400">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </span>
          </div>
          {transactions.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">Aucune transaction.</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {transactions.map((tx) => {
                const isStamp = (tx.stamps_added ?? 0) > 0
                const isRedeem = tx.type === 'redeem'
                const value = isStamp ? tx.stamps_added : tx.points_added
                return (
                  <li key={tx.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-base shrink-0">
                        {isRedeem ? '🎁' : isStamp ? '🎫' : '⭐'}
                      </span>
                      <div>
                        <p className="text-sm text-gray-700">
                          {tx.description ??
                            (isRedeem
                              ? 'Récompense accordée'
                              : isStamp
                              ? 'Tampon ajouté'
                              : 'Points gagnés')}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                      </div>
                    </div>
                    {!isRedeem && value != null && (
                      <p className="text-sm font-semibold shrink-0" style={{ color }}>
                        +{value} {isStamp ? '🎫' : 'pts'}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
