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

  const { phone, token } = await request.json()

  if (!phone || typeof phone !== 'string' || phone.trim().length < 6) {
    return NextResponse.json({ error: 'Téléphone manquant' }, { status: 400 })
  }

  if (!token || typeof token !== 'string' || token.length !== 6) {
    return NextResponse.json({ error: 'Code invalide' }, { status: 400 })
  }

  // Use service client for DB queries (bypass RLS)
  const supabase = createServiceClient()

  // Look up the customer's email via phone (server-side only)
  const { data: customer } = await supabase
    .from('customers')
    .select('id, email')
    .eq('phone', phone.trim())
    .maybeSingle()

  if (!customer || !customer.email) {
    return NextResponse.json({ status: 'invalid' })
  }

  // Use anon key client for Auth operations
  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { error } = await supabaseAuth.auth.verifyOtp({
    email: customer.email,
    token,
    type: 'email',
  })

  if (error) {
    return NextResponse.json({ status: 'invalid' })
  }

  const { data: cards } = await supabase
    .from('loyalty_cards')
    .select('id, qr_code_id, current_stamps, current_points, businesses(business_name, loyalty_type, stamps_required, primary_color)')
    .eq('customer_id', customer.id)

  return NextResponse.json({ status: 'verified', cards: cards ?? [] })
}
