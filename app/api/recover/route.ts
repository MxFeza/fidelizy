export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { recoverLimiter, getIP } from '@/lib/ratelimit'
import { findCustomerCards } from '@/lib/services/customer.service'
import { AppError, withErrorHandler } from '@/lib/errors'

export const GET = withErrorHandler(async (request) => {
  const { success } = await recoverLimiter.limit(getIP(request))
  if (!success) throw AppError.rateLimit('Trop de requêtes. Réessaie dans quelques secondes.')

  const phone = request.nextUrl.searchParams.get('phone')
  if (!phone || phone.trim().length < 6) throw AppError.validation('Numéro de téléphone invalide')

  const supabase = createServiceClient()
  const result = await findCustomerCards(supabase, { phone: phone.trim() })

  return NextResponse.json(result)
})
