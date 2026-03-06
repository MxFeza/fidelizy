import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }

    const businessId = user.id

    const { data: business } = await supabase
      .from('businesses')
      .select('id, business_name, loyalty_type, stamps_required')
      .eq('id', businessId)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 })
    }

    const { data: cards } = await supabase
      .from('loyalty_cards')
      .select('*, customers(*)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (!cards) {
      return NextResponse.json({ error: 'Erreur lors de la recuperation des clients' }, { status: 500 })
    }

    return NextResponse.json({
      business: {
        business_name: business.business_name,
        loyalty_type: business.loyalty_type,
        stamps_required: business.stamps_required,
      },
      clients: cards,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
