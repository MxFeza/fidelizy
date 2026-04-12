import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { scanLimiter, getIP } from '@/lib/ratelimit'
import { scanCard, ServiceError } from '@/lib/services/loyalty.service'
import { z } from 'zod'

const scanInputSchema = z.object({
  qr_code_id: z.string().min(1).max(100),
})

export async function POST(request: NextRequest) {
  try {
    const { success } = await scanLimiter.limit(getIP(request))
    if (!success) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessaie dans quelques secondes.' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = scanInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'qr_code_id invalide' }, { status: 400 })
    }
    const { qr_code_id } = parsed.data

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id, business_name, stamps_required, stamps_reward, loyalty_type, points_per_euro')
      .eq('id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 })
    }

    const result = await scanCard(supabase, { qrCodeId: qr_code_id, business })

    return NextResponse.json({
      success: true,
      customer: result.customer,
      card: result.updatedCard,
      message: result.message,
    })
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}
