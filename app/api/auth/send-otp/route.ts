import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { otpLimiter, getIP } from '@/lib/ratelimit'
import { parseBody, sendOtpSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  const { success } = await otpLimiter.limit(getIP(request))
  if (!success) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
      { status: 429 }
    )
  }

  const parsed = await parseBody(request, sendOtpSchema)
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }
  const { phone } = parsed.data

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

  // Use anon key client for Auth operations
  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { error } = await supabaseAuth.auth.signInWithOtp({
    email: customer.email,
    options: { shouldCreateUser: true },
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

  return NextResponse.json({ status: 'otp_sent', maskedEmail })
}
