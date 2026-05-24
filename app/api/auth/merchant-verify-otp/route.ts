import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { AppError, withErrorHandler } from '@/lib/errors'
import { otpVerifyLimiter, getIP } from '@/lib/ratelimit'
import { verifyOtpSchema } from '@/lib/services/auth.schemas'

export const POST = withErrorHandler(async (request) => {
  const rl = await otpVerifyLimiter.limit(getIP(request))
  if (!rl.success) {
    throw new AppError('Trop de tentatives. Réessayez dans 10 minutes.', 429)
  }

  const body = await request.json().catch(() => ({}))
  // verifyOtpSchema accepte phone OU email + token (refine). Merchant n'envoie
  // que email + token, c'est valide par le refine.
  const parsed = verifyOtpSchema.safeParse(body)
  if (!parsed.success) {
    throw AppError.validation(parsed.error.issues[0]?.message ?? 'Code invalide')
  }
  const { email, token } = parsed.data
  if (!email) throw AppError.validation('Email manquant')

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
