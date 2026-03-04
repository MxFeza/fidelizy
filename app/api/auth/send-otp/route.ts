import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { otpLimiter, getIP } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  const { success } = await otpLimiter.limit(getIP(request))
  if (!success) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
      { status: 429 }
    )
  }

  const { phone } = await request.json()

  if (!phone || typeof phone !== 'string' || phone.trim().length < 6 || phone.trim().length > 20) {
    return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: customer } = await supabase
    .from('customers')
    .select('id, email')
    .eq('phone', phone.trim())
    .maybeSingle()

  if (!customer) {
    return NextResponse.json({ status: 'not_found' })
  }

  if (!customer.email) {
    return NextResponse.json({ status: 'needs_email' })
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: customer.email,
    options: { shouldCreateUser: false },
  })

  if (error) {
    return NextResponse.json({ error: 'Erreur lors de l\'envoi du code.' }, { status: 500 })
  }

  // Mask email for display: j***n@gmail.com
  const [localPart, domain] = customer.email.split('@')
  const masked = localPart.length <= 2
    ? localPart[0] + '***'
    : localPart[0] + '***' + localPart[localPart.length - 1]
  const maskedEmail = `${masked}@${domain}`

  return NextResponse.json({ status: 'otp_sent', email: customer.email, maskedEmail })
}
