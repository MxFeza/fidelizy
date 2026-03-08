import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase/service'

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

  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys not configured')
  }

  return { publicKey, privateKey, subject }
}

async function sendToSubscription(
  sub: webpush.PushSubscription,
  payload: PushPayload,
  vapid: ReturnType<typeof getVapidConfig>
): Promise<boolean> {
  try {
    await webpush.sendNotification(sub, JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      url: payload.url,
    }), {
      vapidDetails: {
        subject: vapid.subject,
        publicKey: vapid.publicKey,
        privateKey: vapid.privateKey,
      },
    })
    return true
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode
    if (statusCode === 410 || statusCode === 404) {
      // Subscription expired or invalid — will be cleaned up
      return false
    }
    console.error('Push send error:', err)
    return false
  }
}

export async function sendPushToCard(cardId: string, payload: PushPayload) {
  const vapid = getVapidConfig()
  const supabase = createServiceClient()

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, subscription')
    .eq('card_id', cardId)

  if (!subscriptions?.length) return

  const expiredIds: string[] = []

  await Promise.allSettled(
    subscriptions.map(async (row) => {
      const ok = await sendToSubscription(row.subscription as webpush.PushSubscription, payload, vapid)
      if (!ok) expiredIds.push(row.id)
    })
  )

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('id', expiredIds)
  }
}

export async function sendPushToAllBusinessClients(businessId: string, payload: PushPayload) {
  const vapid = getVapidConfig()
  const supabase = createServiceClient()

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, subscription')
    .eq('business_id', businessId)

  if (!subscriptions?.length) return

  const expiredIds: string[] = []

  await Promise.allSettled(
    subscriptions.map(async (row) => {
      const ok = await sendToSubscription(row.subscription as webpush.PushSubscription, payload, vapid)
      if (!ok) expiredIds.push(row.id)
    })
  )

  if (expiredIds.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('id', expiredIds)
  }
}
