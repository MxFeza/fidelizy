import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Transaction, RewardTier } from '@/lib/types'
import QrCodeDisplay from '@/app/components/QrCodeDisplay'

interface PageProps {
  params: Promise<{ cardId: string }>
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function CardPage({ params }: PageProps) {
  const { cardId } = await params
  const supabase = await createClient()

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('*, customers(*)')
    .eq('qr_code_id', cardId)
    .single()

  if (!card) notFound()

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', card.business_id)
    .single()

  if (!business) notFound()

  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('loyalty_card_id', card.id)
    .order('created_at', { ascending: false })
    .limit(10)

  let rewardTiers: RewardTier[] = []
  if (business.loyalty_type === 'points') {
    const { data: tiers } = await supabase
      .from('reward_tiers')
      .select('*')
      .eq('business_id', business.id)
      .order('sort_order', { ascending: true })
    rewardTiers = tiers ?? []
  }

  const color = business.primary_color || '#4f46e5'
  const stampsRequired = business.stamps_required ?? 10
  const stampsCount = card.current_stamps ?? 0
  const pointsBalance = card.current_points ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white px-5 pt-12 pb-8" style={{ backgroundColor: color }}>
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <p className="text-white/70 text-xs font-medium">Carte de fidélité</p>
              <p className="font-bold text-lg leading-tight">{business.business_name}</p>
            </div>
          </div>
          <p className="text-white/80 text-sm">
            Bonjour, <span className="font-semibold text-white">{card.customers?.first_name ?? 'Client'}</span> 👋
          </p>
        </div>
      </div>

      <div className="max-w-sm mx-auto px-5 pb-10 space-y-5">
        {/* Stamps card */}
        {business.loyalty_type === 'stamps' && (
          <div className="-mt-4 bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-gray-900">
                  {stampsCount} / {stampsRequired} tampons
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {stampsRequired - stampsCount > 0
                    ? `Plus que ${stampsRequired - stampsCount} tampon${stampsRequired - stampsCount > 1 ? 's' : ''} !`
                    : '🎉 Récompense disponible !'}
                </p>
              </div>
              {stampsCount >= stampsRequired && (
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                  À réclamer
                </span>
              )}
            </div>

            {/* Stamp grid */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Array.from({ length: stampsRequired }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                    i < stampsCount ? 'shadow-sm' : 'bg-gray-100'
                  }`}
                  style={i < stampsCount ? { backgroundColor: `${color}20`, border: `2px solid ${color}` } : {}}
                >
                  {i < stampsCount ? (
                    <svg className="w-5 h-5" style={{ color }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <span className="text-gray-300 text-lg">○</span>
                  )}
                </div>
              ))}
            </div>

            {business.stamps_reward && (
              <div
                className="text-center text-sm font-medium py-2 px-3 rounded-xl"
                style={{ backgroundColor: `${color}15`, color }}
              >
                🎁 Récompense : {business.stamps_reward}
              </div>
            )}
          </div>
        )}

        {/* Points card */}
        {business.loyalty_type === 'points' && (
          <div className="-mt-4 bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <div className="text-center">
              <p className="text-4xl font-bold" style={{ color }}>{pointsBalance}</p>
              <p className="text-gray-400 text-sm mt-1">points cumulés</p>
            </div>

            {rewardTiers.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Paliers de récompenses
                </p>
                {rewardTiers.map((tier) => {
                  const progress = Math.min(100, (pointsBalance / tier.points_required) * 100)
                  const reached = pointsBalance >= tier.points_required
                  return (
                    <div key={tier.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {reached && <span className="text-sm">✅</span>}
                          <p className={`text-sm font-medium ${reached ? 'text-green-700' : 'text-gray-700'}`}>
                            {tier.reward_name}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">{tier.points_required} pts</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${progress}%`, backgroundColor: color }}
                        />
                      </div>
                      {tier.reward_description && (
                        <p className="text-xs text-gray-400">{tier.reward_description}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* QR Code */}
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Mon QR code
          </p>
          <div className="flex justify-center">
            <div className="p-3 bg-gray-50 rounded-xl inline-block">
              <QrCodeDisplay value={card.qr_code_id} size={160} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Présentez ce code au commerçant à chaque visite
          </p>
        </div>

        {/* Transaction history */}
        {recentTransactions && recentTransactions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-semibold text-gray-900">Historique</p>
            </div>
            <ul className="divide-y divide-gray-50">
              {recentTransactions.map((tx: Transaction) => {
                const isStamp = tx.stamps_added != null && tx.stamps_added > 0
                const value = isStamp ? tx.stamps_added : tx.points_added
                return (
                  <li key={tx.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{isStamp ? '🎫' : '⭐'}</span>
                      <p className="text-sm text-gray-600">
                        {tx.description ?? (isStamp ? 'Tampon ajouté' : 'Points gagnés')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold" style={{ color }}>
                        +{value} {isStamp ? '🎫' : 'pts'}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
