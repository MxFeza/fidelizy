import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, token } = await request.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email manquant' }, { status: 400 })
  }

  if (!token || typeof token !== 'string' || token.length !== 6) {
    return NextResponse.json({ error: 'Code invalide' }, { status: 400 })
  }

  // Use SSR client to verify OTP and set session cookies
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
}
