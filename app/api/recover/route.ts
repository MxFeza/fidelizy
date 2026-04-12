import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { recoverLimiter, getIP } from '@/lib/ratelimit'
import { findCustomerCards } from '@/lib/services/customer.service'

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
  const result = await findCustomerCards(supabase, { phone: phone.trim() })

  return NextResponse.json(result)
}
