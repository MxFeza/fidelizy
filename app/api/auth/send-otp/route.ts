import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { otpLimiter, getIP } from '@/lib/ratelimit'
import { sendOtp } from '@/lib/services/auth.service'
import { ServiceError } from '@/lib/services/loyalty.service'

export async function POST(request: NextRequest) {
  try {
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
    const supabaseAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const result = await sendOtp(supabase, supabaseAuth, { phone: phone.trim() })

    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}
