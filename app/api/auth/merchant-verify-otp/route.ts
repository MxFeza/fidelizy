import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { AppError, withErrorHandler } from '@/lib/errors'
import { otpVerifyLimiter, getIP } from '@/lib/ratelimit'

export const POST = withErrorHandler(async (request) => {
  const rl = await otpVerifyLimiter.limit(getIP(request))
  if (!rl.success) {
    throw new AppError('Trop de tentatives. Réessayez dans 10 minutes.', 429)
  }

  const { email, token } = await request.json()
  if (!email || typeof email !== 'string') throw AppError.validation('Email manquant')
  if (!token || typeof token !== 'string' || token.length !== 6) throw AppError.validation('Code invalide')

  const supabase = await createClient()

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error || !data.session) {
    return NextResponse.json({ status: 'invalid' })
  }

  return NextResponse.json({ status: 'verified' })
})
