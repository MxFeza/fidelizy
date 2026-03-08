'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Business } from '@/lib/types'

type TierDraft = {
  id?: string
  reward_name: string
  points_required: number
  reward_description: string
}

type WheelPrizeDraft = {
  id?: string
  label: string
  emoji: string
  probability: number
  reward_type: 'bonus_stamps' | 'bonus_points' | 'custom_reward'
  reward_value: number
  reward_description: string
}

const PRESET_COLORS = [
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Violet', value: '#7c3aed' },
  { label: 'Rose', value: '#e11d48' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Vert', value: '#16a34a' },
  { label: 'Bleu', value: '#2563eb' },
]

export default function SettingsPage() {
  const supabase = createClient()

  const [business, setBusiness] = useState<Business | null>(null)
  const [tiers, setTiers] = useState<TierDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [businessName, setBusinessName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#4f46e5')
  const [loyaltyType, setLoyaltyType] = useState<'stamps' | 'points'>('stamps')
  const [stampsRequired, setStampsRequired] = useState(10)
  const [stampsReward, setStampsReward] = useState('')
  const [pointsPerEuro, setPointsPerEuro] = useState(1)

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

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // businesses.id = auth.users.id
      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', user.id)
        .single()

      if (biz) {
        setBusiness(biz)
        setBusinessName(biz.business_name)
        setPrimaryColor(biz.primary_color || '#4f46e5')
        setLoyaltyType(biz.loyalty_type || 'stamps')
        setStampsRequired(biz.stamps_required || 10)
        setStampsReward(biz.stamps_reward || '')
        setPointsPerEuro(biz.points_per_euro || 1)

        const { data: tierData } = await supabase
          .from('reward_tiers')
          .select('*')
          .eq('business_id', biz.id)
          .order('sort_order', { ascending: true })

        setTiers(
          (tierData ?? []).map((t) => ({
            id: t.id,
            reward_name: t.reward_name,
            points_required: t.points_required,
            reward_description: t.reward_description ?? '',
          }))
        )
      }

      // Load gamification config
      fetch('/api/dashboard/gamification')
        .then((r) => r.json())
        .then((g) => {
          if (!g.error) {
            setInitialStamps(g.initial_stamps ?? 0)
            setGoalGradient(g.goal_gradient_notification !== false)
            setSurpriseEnabled(g.surprise_enabled ?? false)
            setSurpriseProbability(g.surprise_probability ?? 0.2)
            setSurpriseRewardValue(g.surprise_reward_value ?? 1)
            setWheelEnabled(g.wheel_enabled ?? false)
            setWheelCostPoints(g.wheel_cost_points ?? 10)
          }
        })
        .catch(() => {})

      // Load wheel prizes
      fetch('/api/dashboard/wheel-prizes')
        .then((r) => r.json())
        .then((data) => {
          if (data.prizes) {
            setWheelPrizes(
              data.prizes.map((p: Record<string, unknown>) => ({
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
        })
        .catch(() => {})

      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!business) return
    setSaving(true)
    setError('')
    setSaved(false)

    const { error: bizError } = await supabase
      .from('businesses')
      .update({
        business_name: businessName,
        primary_color: primaryColor,
        loyalty_type: loyaltyType,
        stamps_required: stampsRequired,
        stamps_reward: stampsReward,
        points_per_euro: pointsPerEuro,
      })
      .eq('id', business.id)

    if (bizError) {
      setError('Erreur lors de la sauvegarde : ' + bizError.message)
      setSaving(false)
      return
    }

    if (loyaltyType === 'points') {
      await supabase.from('reward_tiers').delete().eq('business_id', business.id)

      const tiersToInsert = tiers
        .filter((t) => t.reward_name.trim() && t.points_required > 0)
        .map((t, i) => ({
          business_id: business.id,
          reward_name: t.reward_name,
          points_required: t.points_required,
          reward_description: t.reward_description,
          sort_order: i,
        }))

      if (tiersToInsert.length > 0) {
        const { error: tierError } = await supabase.from('reward_tiers').insert(tiersToInsert)
        if (tierError) {
          setError('Erreur lors de la sauvegarde des paliers : ' + tierError.message)
          setSaving(false)
          return
        }
      }
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleGamifSave() {
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
      // Fetch current prizes from server
      const currentRes = await fetch('/api/dashboard/wheel-prizes')
      const currentData = await currentRes.json()
      const serverPrizes: { id: string }[] = currentData.prizes ?? []
      const serverIds = new Set(serverPrizes.map((p) => p.id))
      const draftIds = new Set(wheelPrizes.filter((p) => p.id).map((p) => p.id))

      // Delete removed prizes
      for (const sp of serverPrizes) {
        if (!draftIds.has(sp.id)) {
          await fetch('/api/dashboard/wheel-prizes', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: sp.id }),
          })
        }
      }

      // Create or update prizes
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

  function addTier() {
    setTiers([...tiers, { reward_name: '', points_required: 100, reward_description: '' }])
  }

  function removeTier(index: number) {
    setTiers(tiers.filter((_, i) => i !== index))
  }

  function updateTier(index: number, field: keyof TierDraft, value: string | number) {
    setTiers(tiers.map((t, i) => (i === index ? { ...t, [field]: value } : t)))
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
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-400 text-sm mt-0.5">Configurez votre programme de fidélité</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Commerce info */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Informations du commerce</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom du commerce
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur principale
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setPrimaryColor(c.value)}
                  className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c.value,
                    borderColor: primaryColor === c.value ? c.value : 'transparent',
                    outline: primaryColor === c.value ? `2px solid ${c.value}` : 'none',
                    outlineOffset: '2px',
                  }}
                  title={c.label}
                />
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                />
                <span className="text-xs text-gray-400">Personnalisée</span>
              </div>
            </div>
          </div>
        </section>

        {/* Loyalty type */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Type de fidélité</h2>

          <div className="grid grid-cols-2 gap-3">
            {(['stamps', 'points'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setLoyaltyType(type)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  loyaltyType === type
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{type === 'stamps' ? '🎫' : '⭐'}</span>
                <span className={`text-sm font-semibold ${loyaltyType === type ? 'text-indigo-700' : 'text-gray-700'}`}>
                  {type === 'stamps' ? 'Tampons' : 'Points'}
                </span>
                <span className="text-xs text-center text-gray-400">
                  {type === 'stamps'
                    ? 'Carte à tamponner classique'
                    : 'Cumul de points par achat'}
                </span>
              </button>
            ))}
          </div>

          {/* Stamps config */}
          {loyaltyType === 'stamps' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre de tampons requis
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={stampsRequired}
                  onChange={(e) => setStampsRequired(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Récompense offerte
                </label>
                <input
                  type="text"
                  value={stampsReward}
                  onChange={(e) => setStampsReward(e.target.value)}
                  placeholder="Ex: Un café offert, -10% sur la prochaine commande…"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Points config */}
          {loyaltyType === 'points' && (
            <div className="space-y-5 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Points par euro dépensé
                </label>
                <input
                  type="number"
                  min={1}
                  value={pointsPerEuro}
                  onChange={(e) => setPointsPerEuro(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Reward tiers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Paliers de récompenses</label>
                  <button
                    type="button"
                    onClick={addTier}
                    className="text-xs text-indigo-600 font-medium hover:text-indigo-700"
                  >
                    + Ajouter un palier
                  </button>
                </div>

                {tiers.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    Aucun palier configuré. Ajoutez-en un ci-dessus.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {tiers.map((tier, i) => (
                      <div key={i} className="flex gap-2 items-start p-3 bg-gray-50 rounded-xl">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Nom du palier"
                            value={tier.reward_name}
                            onChange={(e) => updateTier(i, 'reward_name', e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <input
                            type="number"
                            placeholder="Points requis"
                            min={1}
                            value={tier.points_required}
                            onChange={(e) => updateTier(i, 'points_required', Number(e.target.value))}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <input
                            type="text"
                            placeholder="Description de la récompense"
                            value={tier.reward_description}
                            onChange={(e) => updateTier(i, 'reward_description', e.target.value)}
                            className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTier(i)}
                          className="text-gray-400 hover:text-red-500 transition-colors mt-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Sauvegardé !
            </span>
          )}
        </div>
      </form>

      {/* Gamification section — separate from main form */}
      <div className="mt-8 space-y-6">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900">Gamification</h2>
            <p className="text-xs text-gray-400 mt-0.5">Augmentez l&apos;engagement de vos clients</p>
          </div>

          {/* Endowed Progress — initial stamps */}
          {loyaltyType === 'stamps' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Tampons de bienvenue</p>
                  <p className="text-xs text-gray-400">Offrir des tampons à l&apos;inscription</p>
                </div>
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
            </div>
          )}

          {/* Goal Gradient */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Notifications de progression</p>
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

          {/* Surprise */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Surprises au scan</p>
                <p className="text-xs text-gray-400">
                  Bonus aléatoire lors d&apos;un scan
                </p>
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
          </div>

          {/* Save gamification */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleGamifSave}
              disabled={gamifSaving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-xl transition-colors text-sm"
            >
              {gamifSaving ? 'Sauvegarde...' : 'Sauvegarder la gamification'}
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
        </section>

        {/* Wheel of Fortune — points only */}
        {loyaltyType === 'points' && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-gray-900">🎡 Roue de la fortune</h2>
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
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] text-gray-400 mb-0.5">Poids</label>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={prize.probability}
                                onChange={(e) => updateWheelPrize(i, 'probability', Math.max(1, Number(e.target.value)))}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-400 mb-0.5">Type</label>
                              <select
                                value={prize.reward_type}
                                onChange={(e) => updateWheelPrize(i, 'reward_type', e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="bonus_points">Points</option>
                                <option value="bonus_stamps">Tampons</option>
                                <option value="custom_reward">Custom</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-400 mb-0.5">Valeur</label>
                              <input
                                type="number"
                                min={0}
                                value={prize.reward_value}
                                onChange={(e) => updateWheelPrize(i, 'reward_value', Math.max(0, Number(e.target.value)))}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                          {prize.reward_type === 'custom_reward' && (
                            <input
                              type="text"
                              placeholder="Description de la récompense"
                              value={prize.reward_description}
                              onChange={(e) => updateWheelPrize(i, 'reward_description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
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
      </div>
    </div>
  )
}
