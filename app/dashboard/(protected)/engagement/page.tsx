'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles } from 'lucide-react'

type WheelPrizeDraft = {
  id?: string
  label: string
  emoji: string
  probability: number
  reward_type: 'bonus_stamps' | 'bonus_points' | 'custom_reward'
  reward_value: number
  reward_description: string
}

type MissionDraft = {
  id: string | null
  template_key: string
  reward_points: number
  is_active: boolean
  config: Record<string, unknown>
}

type PendingValidation = {
  id: string
  customer_name: string
  proof_url: string | null
  points_awarded: number
  template_key: string
  created_at: string
}

export default function EngagementPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [loyaltyType, setLoyaltyType] = useState<'stamps' | 'points'>('stamps')

  // Gamification state
  const [initialStamps, setInitialStamps] = useState(0)
  const [goalGradient, setGoalGradient] = useState(true)
  const [surpriseEnabled, setSurpriseEnabled] = useState(false)
  const [surpriseProbability, setSurpriseProbability] = useState(0.2)
  const [surpriseRewardValue, setSurpriseRewardValue] = useState(1)
  const [gamifSaving, setGamifSaving] = useState(false)
  const [gamifSaved, setGamifSaved] = useState(false)

  // Wheel state
  const [wheelEnabled, setWheelEnabled] = useState(false)
  const [wheelCostPoints, setWheelCostPoints] = useState(10)
  const [wheelPrizes, setWheelPrizes] = useState<WheelPrizeDraft[]>([])
  const [wheelSaving, setWheelSaving] = useState(false)
  const [wheelSaved, setWheelSaved] = useState(false)

  // Missions state
  const [missionsList, setMissionsList] = useState<MissionDraft[]>([])
  const [missionsSaving, setMissionsSaving] = useState(false)
  const [missionsSaved, setMissionsSaved] = useState(false)
  const [pendingValidations, setPendingValidations] = useState<PendingValidation[]>([])
  const [rewardTiers, setRewardTiers] = useState<{ reward_name: string; points_required: number }[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: biz } = await supabase
        .from('businesses')
        .select('loyalty_type')
        .eq('id', user.id)
        .single()

      if (biz) {
        setLoyaltyType(biz.loyalty_type || 'stamps')
      }

      const [gamifRes, prizesRes, missionsRes, pendingRes, tiersRes] = await Promise.all([
        fetch('/api/dashboard/gamification').then((r) => r.json()).catch(() => null),
        fetch('/api/dashboard/wheel-prizes').then((r) => r.json()).catch(() => null),
        fetch('/api/dashboard/missions').then((r) => r.json()).catch(() => null),
        fetch('/api/dashboard/missions/pending').then((r) => r.json()).catch(() => null),
        supabase.from('reward_tiers').select('reward_name, points_required').eq('business_id', user.id).order('sort_order'),
      ])

      if (gamifRes && !gamifRes.error) {
        setInitialStamps(gamifRes.initial_stamps ?? 0)
        setGoalGradient(gamifRes.goal_gradient_notification !== false)
        setSurpriseEnabled(gamifRes.surprise_enabled ?? false)
        setSurpriseProbability(gamifRes.surprise_probability ?? 0.2)
        setSurpriseRewardValue(gamifRes.surprise_reward_value ?? 1)
        setWheelEnabled(gamifRes.wheel_enabled ?? false)
        setWheelCostPoints(gamifRes.wheel_cost_points ?? 10)
      }

      if (prizesRes?.prizes) {
        setWheelPrizes(
          prizesRes.prizes.map((p: Record<string, unknown>) => ({
            id: p.id as string,
            label: p.label as string,
            emoji: (p.emoji as string) || '🎯',
            probability: p.probability as number,
            reward_type: p.reward_type as string,
            reward_value: (p.reward_value as number) ?? 1,
            reward_description: (p.reward_description as string) || '',
          }))
        )
      }

      if (missionsRes?.missions) {
        setMissionsList(missionsRes.missions)
      }

      if (pendingRes?.pending) {
        setPendingValidations(pendingRes.pending)
      }

      if (tiersRes?.data) {
        setRewardTiers(tiersRes.data)
      }

      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave() {
    setGamifSaving(true)
    setGamifSaved(false)
    try {
      const res = await fetch('/api/dashboard/gamification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initial_stamps: initialStamps,
          goal_gradient_notification: goalGradient,
          surprise_enabled: surpriseEnabled,
          surprise_probability: surpriseProbability,
          surprise_reward_type: loyaltyType === 'stamps' ? 'bonus_stamp' : 'bonus_points',
          surprise_reward_value: surpriseRewardValue,
          wheel_enabled: wheelEnabled,
          wheel_cost_points: wheelCostPoints,
        }),
      })
      if (res.ok) {
        setGamifSaved(true)
        setTimeout(() => setGamifSaved(false), 3000)
      }
    } catch { /* ignore */ }
    setGamifSaving(false)
  }

  async function handleWheelSave() {
    setWheelSaving(true)
    setWheelSaved(false)
    try {
      const currentRes = await fetch('/api/dashboard/wheel-prizes')
      const currentData = await currentRes.json()
      const serverPrizes: { id: string }[] = currentData.prizes ?? []
      const serverIds = new Set(serverPrizes.map((p) => p.id))
      const draftIds = new Set(wheelPrizes.filter((p) => p.id).map((p) => p.id))

      for (const sp of serverPrizes) {
        if (!draftIds.has(sp.id)) {
          await fetch('/api/dashboard/wheel-prizes', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: sp.id }),
          })
        }
      }

      for (let i = 0; i < wheelPrizes.length; i++) {
        const p = wheelPrizes[i]
        const payload = {
          label: p.label,
          emoji: p.emoji || '🎯',
          probability: p.probability,
          reward_type: p.reward_type,
          reward_value: p.reward_value,
          reward_description: p.reward_description || null,
          sort_order: i,
        }
        if (p.id && serverIds.has(p.id)) {
          await fetch('/api/dashboard/wheel-prizes', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: p.id, ...payload }),
          })
        } else {
          const res = await fetch('/api/dashboard/wheel-prizes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          const data = await res.json()
          if (data.prize) {
            wheelPrizes[i] = { ...wheelPrizes[i], id: data.prize.id }
          }
        }
      }

      setWheelPrizes([...wheelPrizes])
      setWheelSaved(true)
      setTimeout(() => setWheelSaved(false), 3000)
    } catch { /* ignore */ }
    setWheelSaving(false)
  }

  async function handleMissionsSave() {
    setMissionsSaving(true)
    setMissionsSaved(false)
    try {
      const res = await fetch('/api/dashboard/missions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missions: missionsList }),
      })
      if (res.ok) {
        setMissionsSaved(true)
        setTimeout(() => setMissionsSaved(false), 3000)
      }
    } catch { /* ignore */ }
    setMissionsSaving(false)
  }

  function updateMission(templateKey: string, field: string, value: unknown) {
    setMissionsList(missionsList.map((m) => {
      if (m.template_key !== templateKey) return m
      if (field === 'is_active' || field === 'reward_points') {
        return { ...m, [field]: value }
      }
      return { ...m, config: { ...m.config, [field]: value } }
    }))
  }

  async function handleValidation(completionId: string, approved: boolean) {
    try {
      const res = await fetch('/api/missions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionId, approved }),
      })
      if (res.ok) {
        setPendingValidations(pendingValidations.filter((p) => p.id !== completionId))
      }
    } catch { /* ignore */ }
  }

  function getContextualHint(points: number): string {
    if (!rewardTiers.length) return ''
    const closest = rewardTiers.reduce((prev, curr) =>
      Math.abs(curr.points_required - points) < Math.abs(prev.points_required - points) ? curr : prev
    )
    const pct = Math.round((points / closest.points_required) * 100)
    return `${points} pts = ${pct}% de votre palier "${closest.reward_name}" (${closest.points_required} pts)`
  }

  function addWheelPrize() {
    if (wheelPrizes.length >= 8) return
    setWheelPrizes([...wheelPrizes, {
      label: '',
      emoji: '🎯',
      probability: 10,
      reward_type: 'bonus_points',
      reward_value: 1,
      reward_description: '',
    }])
  }

  function removeWheelPrize(index: number) {
    if (wheelPrizes.length <= 2) return
    setWheelPrizes(wheelPrizes.filter((_, i) => i !== index))
  }

  function updateWheelPrize(index: number, field: keyof WheelPrizeDraft, value: string | number) {
    setWheelPrizes(wheelPrizes.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Engagement</h1>
        </div>
        <p className="text-gray-400 text-sm">Augmentez l&apos;engagement et la fidélité de vos clients</p>
      </div>

      <div className="space-y-6">
        {/* Surprises au scan */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900">Surprises au scan</h2>
            <p className="text-xs text-gray-400 mt-0.5">Bonus aléatoire lors d&apos;un scan client</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Activer les surprises</p>
              <p className="text-xs text-gray-400">Le client reçoit parfois un bonus inattendu</p>
            </div>
            <button
              type="button"
              onClick={() => setSurpriseEnabled(!surpriseEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                surpriseEnabled ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  surpriseEnabled ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {surpriseEnabled && (
            <div className="pl-1 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Probabilité : {Math.round(surpriseProbability * 100)}%
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={0.3}
                  step={0.05}
                  value={surpriseProbability}
                  onChange={(e) => setSurpriseProbability(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>10%</span>
                  <span>30%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Bonus : {surpriseRewardValue} {loyaltyType === 'stamps' ? 'tampon' : 'point'}{surpriseRewardValue > 1 ? 's' : ''}
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={surpriseRewardValue}
                  onChange={(e) => setSurpriseRewardValue(Math.max(1, Math.min(10, Number(e.target.value))))}
                  className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </section>

        {/* Notifications de progression */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900">Notifications de progression</h2>
            <p className="text-xs text-gray-400 mt-0.5">Motivez vos clients quand ils sont proches d&apos;une récompense</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Activer les notifications</p>
              <p className="text-xs text-gray-400">
                {loyaltyType === 'stamps'
                  ? 'Notifier le client à 1 tampon de la récompense'
                  : 'Notifier le client à 1-2 points d\'un palier'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setGoalGradient(!goalGradient)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                goalGradient ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  goalGradient ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </section>

        {/* Roue de la fortune — points only */}
        {loyaltyType === 'points' && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-gray-900">Roue de la fortune</h2>
              <p className="text-xs text-gray-400 mt-0.5">Les clients dépensent des points pour tourner la roue</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Activer la roue</p>
                <p className="text-xs text-gray-400">Disponible sur la page client</p>
              </div>
              <button
                type="button"
                onClick={() => setWheelEnabled(!wheelEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  wheelEnabled ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    wheelEnabled ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            {wheelEnabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Coût par tour (en points)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={wheelCostPoints}
                    onChange={(e) => setWheelCostPoints(Math.max(1, Number(e.target.value)))}
                    className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Segments */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      Segments ({wheelPrizes.length}/8)
                    </label>
                    <button
                      type="button"
                      onClick={addWheelPrize}
                      disabled={wheelPrizes.length >= 8}
                      className="text-xs text-indigo-600 font-medium hover:text-indigo-700 disabled:opacity-40"
                    >
                      + Ajouter un segment
                    </button>
                  </div>

                  {wheelPrizes.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">
                      Aucun segment. Ajoutez au moins 2 segments pour activer la roue.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {wheelPrizes.map((prize, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Emoji"
                              value={prize.emoji}
                              onChange={(e) => updateWheelPrize(i, 'emoji', e.target.value)}
                              className="w-14 px-2 py-2 border border-gray-200 rounded-lg text-center text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <input
                              type="text"
                              placeholder="Nom du segment"
                              value={prize.label}
                              onChange={(e) => updateWheelPrize(i, 'label', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => removeWheelPrize(i)}
                              disabled={wheelPrizes.length <= 2}
                              className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className={`grid gap-2 ${prize.reward_type === 'custom_reward' ? 'grid-cols-2' : 'grid-cols-3'}`}>
                            <div>
                              <label className="block text-[10px] text-gray-400 mb-0.5">Chance</label>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={prize.probability}
                                onChange={(e) => updateWheelPrize(i, 'probability', Math.max(1, Number(e.target.value)))}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <p className="text-[9px] text-gray-300 mt-0.5">Plus c&apos;est haut, plus ça sort</p>
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-400 mb-0.5">Type</label>
                              <select
                                value={prize.reward_type}
                                onChange={(e) => updateWheelPrize(i, 'reward_type', e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="bonus_points">Points bonus</option>
                                <option value="bonus_stamps">Tampons bonus</option>
                                <option value="custom_reward">Récompense spéciale</option>
                              </select>
                            </div>
                            {prize.reward_type !== 'custom_reward' && (
                              <div>
                                <label className="block text-[10px] text-gray-400 mb-0.5">
                                  {prize.reward_type === 'bonus_points' ? 'Points bonus' : 'Tampons bonus'}
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={prize.reward_value}
                                  onChange={(e) => updateWheelPrize(i, 'reward_value', Math.max(0, Number(e.target.value)))}
                                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <p className="text-[9px] text-gray-300 mt-0.5">Ajoutés automatiquement</p>
                              </div>
                            )}
                          </div>
                          {prize.reward_type === 'custom_reward' && (
                            <div>
                              <label className="block text-[10px] text-gray-400 mb-0.5">Description de la récompense</label>
                              <input
                                type="text"
                                placeholder="Ex: Un dessert offert, -20% sur la prochaine commande…"
                                value={prize.reward_description}
                                onChange={(e) => updateWheelPrize(i, 'reward_description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <p className="text-[9px] text-gray-300 mt-0.5">Vous offrez manuellement la récompense au client</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save wheel */}
                <div className="flex items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={handleWheelSave}
                    disabled={wheelSaving || wheelPrizes.length < 2}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-xl transition-colors text-sm"
                  >
                    {wheelSaving ? 'Sauvegarde...' : 'Sauvegarder la roue'}
                  </button>
                  {wheelSaved && (
                    <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Sauvegardé !
                    </span>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tampons de bienvenue — stamps only */}
        {loyaltyType === 'stamps' && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-gray-900">Tampons de bienvenue</h2>
              <p className="text-xs text-gray-400 mt-0.5">Offrez des tampons gratuits à l&apos;inscription</p>
            </div>

            <div className="flex items-center gap-3">
              {[0, 1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setInitialStamps(n)}
                  className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                    initialStamps === n
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {n}
                </button>
              ))}
              <span className="text-xs text-gray-400 ml-1">tampon{initialStamps !== 1 ? 's' : ''}</span>
            </div>
          </section>
        )}

        {/* Missions */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900">Missions</h2>
            <p className="text-xs text-gray-400 mt-0.5">Récompensez vos clients pour leur engagement</p>
          </div>

          <div className="space-y-4">
            {/* Google Review */}
            {(() => {
              const m = missionsList.find((mi) => mi.template_key === 'google_review')
              if (!m) return null
              return (
                <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Avis Google</p>
                      <p className="text-xs text-gray-400">Le client soumet un lien, vous validez</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateMission('google_review', 'is_active', !m.is_active)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${m.is_active ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${m.is_active ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                  {m.is_active && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Récompense :</label>
                      <input
                        type="number"
                        min={1}
                        value={m.reward_points}
                        onChange={(e) => updateMission('google_review', 'reward_points', Math.max(1, Number(e.target.value)))}
                        className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-gray-400">points</span>
                      {loyaltyType === 'points' && rewardTiers.length > 0 && (
                        <p className="text-[10px] text-indigo-500 ml-2">{getContextualHint(m.reward_points)}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Referral */}
            {(() => {
              const m = missionsList.find((mi) => mi.template_key === 'referral')
              if (!m) return null
              return (
                <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Parrainage</p>
                      <p className="text-xs text-gray-400">Code unique par client, bonus mutuel</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateMission('referral', 'is_active', !m.is_active)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${m.is_active ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${m.is_active ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                  {m.is_active && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500">Récompense parrain :</label>
                        <input
                          type="number"
                          min={1}
                          value={m.reward_points}
                          onChange={(e) => updateMission('referral', 'reward_points', Math.max(1, Number(e.target.value)))}
                          className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-gray-400">pts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500">Bonus filleul :</label>
                        <input
                          type="number"
                          min={0}
                          value={(m.config?.referred_bonus as number) ?? 2}
                          onChange={(e) => updateMission('referral', 'referred_bonus', Math.max(0, Number(e.target.value)))}
                          className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-gray-400">pts</span>
                      </div>
                      {loyaltyType === 'points' && rewardTiers.length > 0 && (
                        <p className="text-[10px] text-indigo-500">{getContextualHint(m.reward_points)}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Complete Profile */}
            {(() => {
              const m = missionsList.find((mi) => mi.template_key === 'complete_profile')
              if (!m) return null
              return (
                <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Profil complet</p>
                      <p className="text-xs text-gray-400">Email + date d&apos;anniversaire renseignés</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateMission('complete_profile', 'is_active', !m.is_active)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${m.is_active ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${m.is_active ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                  {m.is_active && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Récompense :</label>
                      <input
                        type="number"
                        min={1}
                        value={m.reward_points}
                        onChange={(e) => updateMission('complete_profile', 'reward_points', Math.max(1, Number(e.target.value)))}
                        className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-gray-400">points</span>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Monthly Visits */}
            {(() => {
              const m = missionsList.find((mi) => mi.template_key === 'monthly_visits')
              if (!m) return null
              return (
                <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Visites mensuelles</p>
                      <p className="text-xs text-gray-400">Comptées automatiquement via la PWA</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateMission('monthly_visits', 'is_active', !m.is_active)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${m.is_active ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${m.is_active ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                  {m.is_active && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500">Cible :</label>
                        <input
                          type="number"
                          min={1}
                          value={(m.config?.target as number) ?? 5}
                          onChange={(e) => updateMission('monthly_visits', 'target', Math.max(1, Number(e.target.value)))}
                          className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-gray-400">visites</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500">Récompense :</label>
                        <input
                          type="number"
                          min={1}
                          value={m.reward_points}
                          onChange={(e) => updateMission('monthly_visits', 'reward_points', Math.max(1, Number(e.target.value)))}
                          className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-gray-400">point{(m.reward_points ?? 1) > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Save missions */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleMissionsSave}
              disabled={missionsSaving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-xl transition-colors text-sm"
            >
              {missionsSaving ? 'Sauvegarde...' : 'Sauvegarder les missions'}
            </button>
            {missionsSaved && (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Sauvegardé !
              </span>
            )}
          </div>
        </section>

        {/* Pending validations */}
        {pendingValidations.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">Validations en attente</h2>
              <p className="text-xs text-gray-400 mt-0.5">{pendingValidations.length} avis à valider</p>
            </div>

            <div className="space-y-3">
              {pendingValidations.map((pv) => (
                <div key={pv.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{pv.customer_name}</p>
                    <p className="text-xs text-gray-500">
                      Avis Google — {pv.points_awarded} pts
                    </p>
                    {pv.proof_url && (
                      <a
                        href={pv.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 underline mt-0.5 block truncate"
                      >
                        {pv.proof_url}
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleValidation(pv.id, true)}
                      className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-bold"
                      title="Valider"
                    >
                      &#10003;
                    </button>
                    <button
                      type="button"
                      onClick={() => handleValidation(pv.id, false)}
                      className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-bold"
                      title="Refuser"
                    >
                      &#10007;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Save all engagement settings */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={gamifSaving}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            {gamifSaving ? 'Sauvegarde...' : 'Sauvegarder l\'engagement'}
          </button>
          {gamifSaved && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Sauvegardé !
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
