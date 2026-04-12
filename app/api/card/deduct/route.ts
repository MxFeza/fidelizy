import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cardWriteLimiter, getIP } from '@/lib/ratelimit'
import { deductFromCard, ServiceError } from '@/lib/services/loyalty.service'
import { z } from 'zod'

const deductInputSchema = z.object({
  card_id: z.string().uuid(),
  type: z.enum(['stamps', 'points']),
  amount: z.coerce.number().int().positive().max(1000),
})

export async function POST(request: NextRequest) {
  try {
    const { success } = await cardWriteLimiter.limit(getIP(request))
    if (!success) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessaie dans quelques secondes.' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = deductInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }
    const { card_id, type, amount } = parsed.data

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
      .select('id')
      .eq('id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 })
    }

    const result = await deductFromCard(supabase, {
      cardId: card_id,
      businessId: business.id,
      type,
      amount,
    })

    return NextResponse.json({ success: true, new_value: result.newValue })
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}
