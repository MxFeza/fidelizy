import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const businessId = user.id

    const { data: topClients } = await supabase
      .from('loyalty_cards')
      .select('id, total_visits, last_visit_at, current_stamps, current_points, customers(first_name, phone)')
      .eq('business_id', businessId)
      .order('total_visits', { ascending: false })
      .limit(3)

    return NextResponse.json({
      topClients: topClients ?? [],
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
