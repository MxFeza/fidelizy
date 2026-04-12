import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/services/auth.service'

export async function POST(request: NextRequest) {
  const { email, token } = await request.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email manquant' }, { status: 400 })
  }

  if (!token || typeof token !== 'string' || token.length !== 6) {
    return NextResponse.json({ error: 'Code invalide' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const result = await verifyOtp(supabase, { email, token })

  return NextResponse.json(result)
}
