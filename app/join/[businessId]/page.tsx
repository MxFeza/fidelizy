import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import JoinForm from './JoinForm'

interface PageProps {
  params: Promise<{ businessId: string }>
}

export default async function JoinPage({ params }: PageProps) {
  const { businessId } = await params
  const supabase = createServiceClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('id, business_name, primary_color, loyalty_type, stamps_required, stamps_reward, points_per_euro')
    .eq('id', businessId)
    .single()

  if (!business) notFound()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ backgroundColor: business.primary_color || '#4f46e5' }}
          >
            <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{business.business_name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {business.loyalty_type === 'stamps'
              ? `Obtenez ${business.stamps_required} tampons et gagnez : ${business.stamps_reward}`
              : `Gagnez ${business.points_per_euro} point(s) par euro dépensé`}
          </p>
        </div>

        <JoinForm business={business} />
      </div>
    </div>
  )
}
