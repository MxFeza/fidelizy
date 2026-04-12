import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { AppError, withErrorHandler } from '@/lib/errors'

export const GET = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw AppError.auth('Non authentifié')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, business_name, loyalty_type, stamps_required')
    .eq('id', user.id)
    .single()

  if (!business) throw AppError.notFound('Commerce introuvable')

  const { data: cards } = await supabase
    .from('loyalty_cards')
    .select('*, customers(*)')
    .eq('business_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({
    business: {
      business_name: business.business_name,
      loyalty_type: business.loyalty_type,
      stamps_required: business.stamps_required,
    },
    clients: cards ?? [],
  })
})
