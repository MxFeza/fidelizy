import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { otpLimiter, getIP } from '@/lib/ratelimit'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  const { success } = await otpLimiter.limit(getIP(request))
  if (!success) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
      { status: 429 }
    )
  }

  const { phone, email } = await request.json()

  if (!phone || typeof phone !== 'string' || phone.trim().length < 6 || phone.trim().length > 20) {
    return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 })
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
  }

  // Service client for DB update (bypass RLS)
  const supabase = createServiceClient()

  const { error: updateError } = await supabase
    .from('customers')
    .update({ email: email.trim().toLowerCase() })
    .eq('phone', phone.trim())

  if (updateError) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour.' }, { status: 500 })
  }

  // Anon key client for Auth operations
  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { error: otpError } = await supabaseAuth.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  })

  if (otpError) {
    console.error('signInWithOtp error:', otpError.message, otpError.status)
    return NextResponse.json({ error: 'Erreur lors de l\'envoi du code.' }, { status: 500 })
  }

  return NextResponse.json({ status: 'otp_sent' })
}
