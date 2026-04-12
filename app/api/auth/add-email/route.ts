import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { otpLimiter, getIP } from '@/lib/ratelimit'
import { addEmailAndSendOtp } from '@/lib/services/auth.service'
import { AppError, withErrorHandler } from '@/lib/errors'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const POST = withErrorHandler(async (request) => {
  const { success } = await otpLimiter.limit(getIP(request))
  if (!success) throw AppError.rateLimit('Trop de requêtes. Réessayez dans quelques minutes.')

  const { phone, email } = await request.json()
  if (!phone || typeof phone !== 'string' || phone.trim().length < 6 || phone.trim().length > 20) {
    throw AppError.validation('Numéro de téléphone invalide')
  }
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    throw AppError.validation('Email invalide')
  }

  const supabase = createServiceClient()
  const supabaseAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const result = await addEmailAndSendOtp(supabase, supabaseAuth, {
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
  })

  return NextResponse.json(result)
})
