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
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
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
    </div>
  )
}
