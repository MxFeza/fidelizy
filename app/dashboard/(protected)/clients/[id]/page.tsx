import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ClientDetailClient from './ClientDetailClient'
import { resolveClientTiers } from '@/lib/services/loyalty.tiers'
import type { Business, Customer, LoyaltyCard, Transaction } from '@/lib/types'

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

  // Les paliers viennent du JSONB businesses.reward_tiers (source unique
  // depuis Story 4.4). La table legacy `reward_tiers` n'est plus consultée
  // côté merchant non plus depuis 2026-05-12, sinon merchant et client
  // voient des paliers différents (le merchant configure dans
  // /marketing/loyalty qui écrit le JSONB, pas la table).
  const tiers = resolveClientTiers(business)

  return (
    <ClientDetailClient
      card={card as LoyaltyCard & { customers: Customer }}
      business={business as Business}
      transactions={(transactions ?? []) as Transaction[]}
      tiers={tiers}
    />
  )
}
