'use client'

import { useState } from 'react'
import type { Business, LoyaltyCard, Customer } from '@/lib/types'

export type MissionData = {
  id: string
  template_key: string
  reward_points: number
  config: Record<string, unknown>
  completed: boolean
  pending?: boolean
  profile_complete?: boolean
  progress?: { current: number; target: number }
  referral_count?: number
}

interface MissionsTabProps {
  card: LoyaltyCard & { customers: Customer | null }
  business: Business
  missions: MissionData[]
  referralCode: string
  cardToken: string
  color: string
  onPointsUpdate: (updater: (prev: number) => number) => void
  onMissionsUpdate: (missions: MissionData[]) => void
}

export default function MissionsTab({
  card,
  business,
  missions,
  referralCode,
  cardToken,
  color,
  onPointsUpdate,
  onMissionsUpdate,
}: MissionsTabProps) {
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewUrl, setReviewUrl] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [profileEmail, setProfileEmail] = useState(card.customers?.email || '')
  const [profileBirthday, setProfileBirthday] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  return (
    <>
      {missions.length === 0 ? (
        <div className="-mt-4 bg-white rounded-2xl shadow-sm p-6 text-center">
          <p className="text-gray-400 text-sm">Aucune mission disponible pour le moment</p>
        </div>
      ) : (
        <div className="-mt-4 bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Missions
          </p>

          <div className="space-y-3">
            {missions.map((m) => {
              const isCompleted = m.completed
              const isPending = m.pending

              return (
                <div key={m.id} className="flex items-start gap-3">
                  <span className="text-base mt-0.5 shrink-0">
                    {isCompleted ? '\u2705' : isPending ? '\u23F3' : m.template_key === 'monthly_visits' && m.progress ? '\u25D0' : '\u2610'}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium ${isCompleted ? 'text-green-700' : 'text-gray-800'}`}>
                        {m.template_key === 'google_review' && 'Laisser un avis Google'}
                        {m.template_key === 'complete_profile' && 'Compléter votre profil'}
                        {m.template_key === 'referral' && 'Parrainer un ami'}
                        {m.template_key === 'monthly_visits' && `${(m.config?.target as number) ?? 5} visites ce mois`}
                      </p>
                      <span className="text-xs font-semibold shrink-0" style={{ color }}>
                        +{m.reward_points} pt{m.reward_points > 1 ? 's' : ''}
                      </span>
                    </div>

                    {m.template_key === 'monthly_visits' && m.progress && !isCompleted && (
                      <div className="mt-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, (m.progress.current / m.progress.target) * 100)}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                          <span className="text-[11px] text-gray-400 font-medium shrink-0">
                            {m.progress.current}/{m.progress.target}
                          </span>
                        </div>
                      </div>
                    )}

                    {m.template_key === 'google_review' && !isCompleted && !isPending && (
                      <div className="mt-2">
                        {!showReviewForm ? (
                          <button
                            onClick={() => setShowReviewForm(true)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                            style={{ backgroundColor: color }}
                          >
                            Soumettre
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="url"
                              placeholder="Lien de votre avis Google"
                              value={reviewUrl}
                              onChange={(e) => setReviewUrl(e.target.value)}
                              className="flex-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                              onClick={async () => {
                                if (!reviewUrl.trim()) return
                                setReviewSubmitting(true)
                                try {
                                  const res = await fetch('/api/missions/complete', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'X-Card-Token': cardToken },
                                    body: JSON.stringify({ cardId: card.id, templateKey: 'google_review', proofUrl: reviewUrl }),
                                  })
                                  if (res.ok) {
                                    onMissionsUpdate(missions.map((mi) =>
                                      mi.id === m.id ? { ...mi, pending: true } : mi
                                    ))
                                    setShowReviewForm(false)
                                    setReviewUrl('')
                                  }
                                } catch { /* ignore */ }
                                setReviewSubmitting(false)
                              }}
                              disabled={reviewSubmitting}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white shrink-0"
                              style={{ backgroundColor: color }}
                            >
                              {reviewSubmitting ? '...' : 'Valider'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {m.template_key === 'google_review' && isPending && (
                      <p className="text-xs text-amber-600 mt-1">En attente de validation</p>
                    )}
                    {m.template_key === 'google_review' && isCompleted && (
                      <p className="text-xs text-green-600 mt-1">Fait !</p>
                    )}

                    {m.template_key === 'complete_profile' && !isCompleted && (
                      <div className="mt-2">
                        {!showProfileForm ? (
                          <button
                            onClick={() => setShowProfileForm(true)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                            style={{ backgroundColor: color }}
                          >
                            Compléter
                          </button>
                        ) : (
                          <div className="space-y-2 mt-1">
                            <input
                              type="email"
                              placeholder="Email"
                              value={profileEmail}
                              onChange={(e) => setProfileEmail(e.target.value)}
                              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <input
                              type="date"
                              placeholder="Date d'anniversaire"
                              value={profileBirthday}
                              onChange={(e) => setProfileBirthday(e.target.value)}
                              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                              onClick={async () => {
                                setProfileSaving(true)
                                try {
                                  const res = await fetch('/api/card/update-profile', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'X-Card-Token': cardToken },
                                    body: JSON.stringify({
                                      cardId: card.id,
                                      email: profileEmail || undefined,
                                      birthday: profileBirthday || undefined,
                                    }),
                                  })
                                  const data = await res.json()
                                  if (data.mission_completed) {
                                    onMissionsUpdate(missions.map((mi) =>
                                      mi.id === m.id ? { ...mi, completed: true } : mi
                                    ))
                                    onPointsUpdate((prev) => prev + (data.points_awarded ?? 0))
                                  }
                                  setShowProfileForm(false)
                                } catch { /* ignore */ }
                                setProfileSaving(false)
                              }}
                              disabled={profileSaving}
                              className="text-xs font-semibold px-4 py-2 rounded-lg text-white"
                              style={{ backgroundColor: color }}
                            >
                              {profileSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {m.template_key === 'complete_profile' && isCompleted && (
                      <p className="text-xs text-green-600 mt-1">Fait !</p>
                    )}

                    {m.template_key === 'referral' && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(referralCode).catch(() => {})
                            setCodeCopied(true)
                            setTimeout(() => setCodeCopied(false), 2000)
                          }}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors"
                          style={{ borderColor: color, color }}
                        >
                          {codeCopied ? 'Copié !' : `Mon code : ${referralCode}`}
                        </button>
                        {typeof navigator !== 'undefined' && 'share' in navigator && (
                          <button
                            onClick={() => {
                              const shareUrl = business.short_code
                                ? `${window.location.origin}/join/${business.short_code}?ref=${referralCode}`
                                : window.location.origin
                              navigator.share({
                                title: `Rejoins ${business.business_name}`,
                                text: `Rejoins ${business.business_name} sur Izou et gagne des points ! 🎁\nUtilise mon code parrain ${referralCode} à l'inscription.\n👉 ${shareUrl}`,
                              }).catch(() => {})
                            }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                            style={{ backgroundColor: color }}
                          >
                            Partager
                          </button>
                        )}
                      </div>
                    )}

                    {m.template_key === 'monthly_visits' && isCompleted && (
                      <p className="text-xs text-green-600 mt-1">Fait !</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Referral code section (always visible if code exists) */}
      {referralCode && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Mon code parrain
          </p>
          <div className="flex items-center gap-3">
            <div
              className="flex-1 text-center text-lg font-bold tracking-wider py-2 rounded-xl"
              style={{ backgroundColor: `${color}10`, color }}
            >
              {referralCode}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(referralCode).catch(() => {})
                setCodeCopied(true)
                setTimeout(() => setCodeCopied(false), 2000)
              }}
              className="shrink-0 p-2.5 rounded-xl border transition-colors"
              style={{ borderColor: color, color }}
            >
              {codeCopied ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
              )}
            </button>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={() => {
                  const shareUrl = business.short_code
                    ? `${window.location.origin}/join/${business.short_code}?ref=${referralCode}`
                    : window.location.origin
                  navigator.share({
                    title: `Rejoins ${business.business_name}`,
                    text: `Rejoins ${business.business_name} sur Izou et gagne des points ! 🎁\nUtilise mon code parrain ${referralCode} à l'inscription.\n👉 ${shareUrl}`,
                  }).catch(() => {})
                }}
                className="shrink-0 p-2.5 rounded-xl text-white"
                style={{ backgroundColor: color }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
