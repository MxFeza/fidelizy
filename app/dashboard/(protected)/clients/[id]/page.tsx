import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ClientDetailClient from './ClientDetailClient'
import type { Business, Customer, LoyaltyCard, Transaction, RewardTier } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!business) redirect('/dashboard/settings')

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('*, customers(*)')
    .eq('id', id)
    .eq('business_id', business.id)
    .single()

  if (!card) notFound()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('loyalty_card_id', card.id)
    .order('created_at', { ascending: false })

  const { data: rewardTiers } = await supabase
    .from('reward_tiers')
    .select('*')
    .eq('business_id', business.id)
    .order('sort_order', { ascending: true })

  return (
    <ClientDetailClient
      card={card as LoyaltyCard & { customers: Customer }}
      business={business as Business}
      transactions={(transactions ?? []) as Transaction[]}
      rewardTiers={(rewardTiers ?? []) as RewardTier[]}
    />
  )
}
