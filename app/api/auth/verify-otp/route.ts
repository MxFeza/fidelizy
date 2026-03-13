import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { otpLimiter, getIP } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  const { success } = await otpLimiter.limit(getIP(request))
  if (!success) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans quelques minutes.' },
      { status: 429 }
    )
  }

  const { email, token } = await request.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email manquant' }, { status: 400 })
  }

  if (!token || typeof token !== 'string' || token.length !== 6) {
    return NextResponse.json({ error: 'Code invalide' }, { status: 400 })
  }

  // Use anon key client for Auth operations
  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  console.log('Tentative verifyOtp:', { email, tokenLength: token?.length })

  const { data, error } = await supabaseAuth.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  console.log('Résultat verifyOtp:', { data: data?.user?.id, error: error?.message })

  if (error) {
    return NextResponse.json({ status: 'invalid' })
  }

  // Use service client for DB queries (bypass RLS)
  const supabase = createServiceClient()

  // Find customer by email and return their cards
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (!customer) {
    return NextResponse.json({ status: 'invalid' })
  }

  const { data: cards } = await supabase
    .from('loyalty_cards')
    .select('id, qr_code_id, current_stamps, current_points, businesses(business_name, loyalty_type, stamps_required, primary_color)')
    .eq('customer_id', customer.id)

  return NextResponse.json({ status: 'verified', cards: cards ?? [] })
}
