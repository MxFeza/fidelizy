import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { RewardTier } from '@/lib/types'
import CardPageClient from './CardPageClient'

interface PageProps {
  params: Promise<{ cardId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cardId } = await params
  const supabase = await createClient()

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('business_id')
    .eq('qr_code_id', cardId)
    .single()

  let title = 'Ma carte de fidélité'
  let themeColor = '#4f46e5'

  if (card) {
    const { data: business } = await supabase
      .from('businesses')
      .select('business_name, primary_color')
      .eq('id', card.business_id)
      .single()
    if (business) {
      title = `Carte ${business.business_name}`
      themeColor = business.primary_color || '#4f46e5'
    }
  }

  return {
    title,
    manifest: `/api/manifest/${cardId}`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title,
    },
    other: {
      'theme-color': themeColor,
    },
  }
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

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('loyalty_card_id', card.id)
    .order('created_at', { ascending: false })

  let rewardTiers: RewardTier[] = []
  if (business.loyalty_type === 'points') {
    const { data: tiers } = await supabase
      .from('reward_tiers')
      .select('*')
      .eq('business_id', business.id)
      .order('sort_order', { ascending: true })
    rewardTiers = tiers ?? []
  }

  return (
    <CardPageClient
      card={card}
      business={business}
      transactions={transactions ?? []}
      rewardTiers={rewardTiers}
    />
  )
}
