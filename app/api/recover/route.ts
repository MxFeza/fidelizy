import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { recoverLimiter, getIP } from '@/lib/ratelimit'

export async function GET(request: NextRequest) {
  const { success } = await recoverLimiter.limit(getIP(request))
  if (!success) {
    return NextResponse.json({ error: 'Trop de requêtes. Réessaie dans quelques secondes.' }, { status: 429 })
  }

  const phone = request.nextUrl.searchParams.get('phone')

  if (!phone || phone.trim().length < 6) {
    return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Find customer by phone
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', phone.trim())
    .maybeSingle()

  if (!customer) {
    return NextResponse.json({ cards: [] })
  }

  // Fetch all loyalty cards for this customer, with business info
  const { data: cards } = await supabase
    .from('loyalty_cards')
    .select('qr_code_id, current_stamps, current_points, businesses(business_name, loyalty_type, stamps_required, primary_color)')
    .eq('customer_id', customer.id)

  return NextResponse.json({ cards: cards ?? [] })
}
