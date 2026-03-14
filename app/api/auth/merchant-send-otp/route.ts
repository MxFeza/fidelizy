import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { merchantOtpLimiter, getIP } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  const { success } = await merchantOtpLimiter.limit(getIP(request))
  if (!success) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans quelques minutes.' },
      { status: 429 }
    )
  }

  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
  }

  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Verify credentials
  const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return NextResponse.json({ error: 'Identifiants incorrects.' }, { status: 401 })
  }

  // Sign out immediately — session must not be created before OTP verification
  await supabaseAuth.auth.signOut()

  // Send OTP to merchant email
  const { error: otpError } = await supabaseAuth.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })

  if (otpError) {
    return NextResponse.json({ error: 'Erreur lors de l\'envoi du code.' }, { status: 500 })
  }

  return NextResponse.json({ status: 'otp_sent' })
}
