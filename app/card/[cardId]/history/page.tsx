import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import HistoryClient from './HistoryClient'

interface PageProps {
  params: Promise<{ cardId: string }>
}

export const metadata: Metadata = {
  title: 'Historique',
}

export default async function HistoryPage({ params }: PageProps) {
  const { cardId } = await params
  const supabase = createServiceClient()

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id, qr_code_id, business_id')
    .eq('qr_code_id', cardId)
    .single()

  if (!card) notFound()

  const { data: business } = await supabase
    .from('businesses')
    .select('business_name, primary_color')
    .eq('id', card.business_id)
    .single()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('loyalty_card_id', card.id)
    .order('created_at', { ascending: false })

  return (
    <HistoryClient
      cardId={card.qr_code_id}
      businessName={business?.business_name ?? ''}
      transactions={transactions ?? []}
    />
  )
}
