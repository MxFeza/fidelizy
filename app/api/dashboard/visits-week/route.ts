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

    // Get visits for the last 7 days
    const days: { label: string; count: number }[] = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)

      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('type', 'earn')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())

      days.push({
        label: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        count: count ?? 0,
      })
    }

    return NextResponse.json({ days })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
