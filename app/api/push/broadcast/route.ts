import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { broadcastLimiter } from '@/lib/ratelimit'
import webpush from 'web-push'

function getVapidConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:contact@fidelizy.app'
  if (!publicKey || !privateKey) throw new Error('VAPID keys not configured')
  return { publicKey, privateKey, subject }
}

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
  // Authenticate merchant
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Rate limit per business (5/hour)
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

  const serviceClient = createServiceClient()
  const vapid = getVapidConfig()

  // Get all active subscriptions for this business
  const { data: subscriptions } = await serviceClient
    .from('push_subscriptions')
    .select('id, card_id, subscription, loyalty_cards!inner(qr_code_id)')
    .eq('business_id', user.id)

  if (!subscriptions?.length) {
    return NextResponse.json({ sent: 0, errors: 0 })
  }

  let sent = 0
  let errors = 0
  const expiredIds: string[] = []

  await Promise.allSettled(
    subscriptions.map(async (row) => {
      const card = row.loyalty_cards as unknown as { qr_code_id: string }
      try {
        await webpush.sendNotification(
          row.subscription as unknown as webpush.PushSubscription,
          JSON.stringify({
            title,
            body,
            icon: '/icon-192.png',
            url: `https://fidelizy.vercel.app/card/${card.qr_code_id}`,
          }),
          {
            vapidDetails: {
              subject: vapid.subject,
              publicKey: vapid.publicKey,
              privateKey: vapid.privateKey,
            },
          }
        )
        sent++
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 410 || statusCode === 404) {
          expiredIds.push(row.id)
        } else {
          console.error(`Broadcast push failed for sub ${row.id}:`, err)
          errors++
        }
      }
    })
  )

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await serviceClient
      .from('push_subscriptions')
      .delete()
      .in('id', expiredIds)
  }

  return NextResponse.json({ sent, errors })
}
