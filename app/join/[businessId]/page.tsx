import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import JoinFlow from './JoinFlow'

interface PageProps {
  params: Promise<{ businessId: string }>
  searchParams: Promise<{ ref?: string }>
}

export default async function JoinPage({ params, searchParams }: PageProps) {
  const { businessId } = await params
  const { ref: referralCode } = await searchParams
  const supabase = createServiceClient()

  // Try by ID first, then by short_code
  let business
  const { data: byId } = await supabase
    .from('businesses')
    .select('id, business_name, primary_color, loyalty_type, stamps_required, stamps_reward, points_per_euro, logo_url, gamification')
    .eq('id', businessId)
    .single()

  if (byId) {
    business = byId
  } else {
    const { data: byShortCode } = await supabase
      .from('businesses')
      .select('id, business_name, primary_color, loyalty_type, stamps_required, stamps_reward, points_per_euro, logo_url, gamification')
      .eq('short_code', businessId)
      .single()
    business = byShortCode
  }

  if (!business) notFound()

  return <JoinFlow business={business} initialReferralCode={referralCode} />
}
