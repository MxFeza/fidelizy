import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { merchantOtpLimiter, getIP } from '@/lib/ratelimit'
import { AppError, withErrorHandler } from '@/lib/errors'
import { merchantSignInSchema } from '@/lib/services/auth.schemas'

export const POST = withErrorHandler(async (request) => {
  const { success } = await merchantOtpLimiter.limit(getIP(request))
  if (!success) throw AppError.rateLimit('Trop de tentatives. Réessayez dans quelques minutes.')

  const body = await request.json().catch(() => ({}))
  const parsed = merchantSignInSchema.safeParse(body)
  if (!parsed.success) {
    throw AppError.validation(parsed.error.issues[0]?.message ?? 'Email et mot de passe requis')
  }
  const { email, password } = parsed.data

  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { error: signInError } = await supabaseAuth.auth.signInWithPassword({ email, password })
  if (signInError) throw AppError.auth('Identifiants incorrects.')

  await supabaseAuth.auth.signOut()

  const { error: otpError } = await supabaseAuth.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })

  if (otpError) throw new AppError("Erreur lors de l'envoi du code.", 500)

  return NextResponse.json({ status: 'otp_sent' })
})
