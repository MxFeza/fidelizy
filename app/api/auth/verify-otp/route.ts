import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, token } = await request.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email manquant' }, { status: 400 })
  }

  if (!token || typeof token !== 'string' || token.length !== 6) {
    return NextResponse.json({ error: 'Code invalide' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    return NextResponse.json({ status: 'invalid' })
  }

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
