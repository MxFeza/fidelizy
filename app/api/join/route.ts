import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { joinLimiter, getIP } from '@/lib/ratelimit'
import { registerCustomer } from '@/lib/services/customer.service'
import { ServiceError } from '@/lib/services/loyalty.service'

export async function POST(request: NextRequest) {
  try {
    const { success } = await joinLimiter.limit(getIP(request))
    if (!success) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessaie dans quelques secondes.' }, { status: 429 })
    }

    const { businessId, firstName, phone, email, referral_code } = await request.json()

    if (!businessId || !firstName || !phone || !email) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }
    if (typeof firstName !== 'string' || firstName.trim().length < 1 || firstName.trim().length > 100) {
      return NextResponse.json({ error: 'Prénom invalide' }, { status: 400 })
    }
    if (typeof phone !== 'string' || phone.trim().length < 6 || phone.trim().length > 20) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 })
    }
    if (typeof businessId !== 'string' || businessId.length > 100) {
      return NextResponse.json({ error: 'businessId invalide' }, { status: 400 })
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const result = await registerCustomer(supabase, {
      businessId,
      firstName: firstName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      referralCode: referral_code,
    })

    return NextResponse.json({ qrCodeId: result.qrCodeId, cardId: result.cardId })
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}
