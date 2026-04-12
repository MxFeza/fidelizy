import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { broadcastLimiter } from '@/lib/ratelimit'
import { createServiceClient } from '@/lib/supabase/service'
import { broadcastToBusinessClients } from '@/lib/services/notification.service'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const serviceClient = createServiceClient()
  const { count } = await serviceClient
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', user.id)

  return NextResponse.json({ count: count ?? 0 })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { success: rateLimitOk } = await broadcastLimiter.limit(user.id)
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: 'Limite atteinte : 5 notifications par heure maximum.' },
      { status: 429 }
    )
  }

  const { title, body } = await request.json()

  if (!title || !body) {
    return NextResponse.json({ error: 'Titre et message requis' }, { status: 400 })
  }
  if (typeof title !== 'string' || title.length > 50) {
    return NextResponse.json({ error: 'Titre trop long (50 caractères max)' }, { status: 400 })
  }
  if (typeof body !== 'string' || body.length > 100) {
    return NextResponse.json({ error: 'Message trop long (100 caractères max)' }, { status: 400 })
  }

  try {
    await broadcastToBusinessClients(user.id, { title, body })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur lors de l\'envoi' }, { status: 500 })
  }
}
