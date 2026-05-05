import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import NotificationsClient from './NotificationsClient'

interface PageProps {
  params: Promise<{ cardId: string }>
}

export const metadata: Metadata = {
  title: 'Notifications',
}

export default async function NotificationsPage({ params }: PageProps) {
  const { cardId } = await params
  const supabase = createServiceClient()

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('qr_code_id')
    .eq('qr_code_id', cardId)
    .single()

  if (!card) notFound()

  return <NotificationsClient cardId={card.qr_code_id} notifications={[]} />
}
