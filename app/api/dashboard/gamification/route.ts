import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('gamification')
    .eq('id', user.id)
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 })
  }

  const initialStamps = (business.gamification as Record<string, unknown>)?.initial_stamps ?? 0

  return NextResponse.json({ initial_stamps: initialStamps })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json()

  const initialStamps =
    typeof body.initial_stamps === 'number'
      ? Math.max(0, Math.min(3, Math.floor(body.initial_stamps)))
      : undefined

  if (initialStamps === undefined) {
    return NextResponse.json({ error: 'initial_stamps requis (0-3)' }, { status: 400 })
  }

  const { error } = await supabase
    .from('businesses')
    .update({ gamification: { initial_stamps: initialStamps } })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }

  return NextResponse.json({ initial_stamps: initialStamps })
}
