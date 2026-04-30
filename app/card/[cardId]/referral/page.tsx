import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Gift01 } from '@untitledui/icons'
import TopBarClient from '@/components/client/TopBarClient'
import BottomTabBarClient from '@/components/client/BottomTabBarClient'

interface PageProps {
  params: Promise<{ cardId: string }>
}

export const metadata = {
  title: 'Parrainage — Izou',
}

export default async function ReferralPage({ params }: PageProps) {
  const { cardId } = await params
  const supabase = createServiceClient()

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id, qr_code_id, business_id')
    .eq('qr_code_id', cardId)
    .single()

  if (!card) notFound()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBarClient
        rightSlot={
          <Link
            href={`/card/${cardId}`}
            aria-label="Retour"
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
        }
      />

      <div className="max-w-md mx-auto px-5 py-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-brand-secondary/10 flex items-center justify-center mb-4">
            <Gift01 className="size-7 text-brand-secondary" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Parrainage</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Invitez vos proches à rejoindre votre commerce préféré et gagnez
            tous les deux des récompenses exclusives.
          </p>
          <p className="text-xs text-gray-400 mt-6 italic">
            Expérience parrainage en cours de création — disponible très bientôt.
          </p>
        </div>
      </div>

      <BottomTabBarClient cardId={cardId} />
    </div>
  )
}
