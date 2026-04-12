import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { otpLimiter, getIP } from '@/lib/ratelimit'
import { sendOtp } from '@/lib/services/auth.service'
import { AppError, withErrorHandler } from '@/lib/errors'

export const POST = withErrorHandler(async (request) => {
  const { success } = await otpLimiter.limit(getIP(request))
  if (!success) throw AppError.rateLimit('Trop de requêtes. Réessayez dans quelques minutes.')

  const { phone } = await request.json()
  if (!phone || typeof phone !== 'string' || phone.trim().length < 6 || phone.trim().length > 20) {
    throw AppError.validation('Numéro de téléphone invalide')
  }

  const supabase = createServiceClient()
  const supabaseAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const result = await sendOtp(supabase, supabaseAuth, { phone: phone.trim() })

  return NextResponse.json(result)
})
