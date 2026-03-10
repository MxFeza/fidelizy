import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import webpush from 'web-push'

interface PushPayload {
  title: string
  body: string
  icon?: string
  url?: string
}

function getVapidConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:contact@fidelizy.app'
  if (!publicKey || !privateKey) throw new Error('VAPID keys not configured')
  return { publicKey, privateKey, subject }
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const vapid = getVapidConfig()

  // Find inactive cards (last visit > 30 days) that have active push subscriptions
  // and haven't been notified in the last 7 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: subscriptions, error: fetchError } = await supabase
    .from('push_subscriptions')
    .select(`
      id,
      card_id,
      subscription,
      last_push_sent_at,
      loyalty_cards!inner(id, business_id, qr_code_id, last_visit_at),
      businesses!inner(business_name)
    `)
    .lt('loyalty_cards.last_visit_at', thirtyDaysAgo)
    .or(`last_push_sent_at.is.null,last_push_sent_at.lt.${sevenDaysAgo}`)
    .limit(100)

  if (fetchError) {
    console.error('Cron push-inactive fetch error:', fetchError)
    return NextResponse.json({ error: 'Database error', details: fetchError.message }, { status: 500 })
  }

  if (!subscriptions?.length) {
    return NextResponse.json({ sent: 0, errors: 0, skipped: 0 })
  }

  let sent = 0
  let errors = 0
  const expiredIds: string[] = []
  const sentIds: string[] = []

  for (const row of subscriptions) {
    const card = row.loyalty_cards as unknown as { id: string; business_id: string; qr_code_id: string; last_visit_at: string }
    const business = row.businesses as unknown as { business_name: string }

    const payload: PushPayload = {
      title: 'Izou',
      body: 'Vous nous manquez ! Revenez profiter de vos avantages fidélité 🎁',
      url: `https://fidelizy.vercel.app/card/${card.qr_code_id}`,
    }

    try {
      await webpush.sendNotification(
        row.subscription as unknown as webpush.PushSubscription,
        JSON.stringify(payload),
        {
          vapidDetails: {
            subject: vapid.subject,
            publicKey: vapid.publicKey,
            privateKey: vapid.privateKey,
          },
        }
      )
      sent++
      sentIds.push(row.id)
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode
      if (statusCode === 410 || statusCode === 404) {
        expiredIds.push(row.id)
      } else {
        console.error(`Push failed for sub ${row.id}:`, err)
        errors++
      }
    }
  }

  // Update last_push_sent_at for successfully sent notifications
  if (sentIds.length > 0) {
    await supabase
      .from('push_subscriptions')
      .update({ last_push_sent_at: new Date().toISOString() })
      .in('id', sentIds)
  }

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('id', expiredIds)
  }

  return NextResponse.json({
    sent,
    errors,
    skipped: expiredIds.length,
  })
}
