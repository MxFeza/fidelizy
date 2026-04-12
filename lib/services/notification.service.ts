import { sendPushToCard, sendPushToAllBusinessClients } from '@/lib/push/sendPush'
import { notifyWalletDevices } from '@/lib/wallet/push'
import type { NotificationPayload } from './notification.schemas'

/**
 * Unified notification service — dispatches to all active channels for a card.
 * Channels: web push (VAPID), Apple Wallet (APNs), future Google Wallet.
 */
export async function notifyClient(
  cardId: string,
  qrCodeId: string,
  payload: NotificationPayload
): Promise<{ sent: string[]; failed: string[] }> {
  const sent: string[] = []
  const failed: string[] = []

  // Channel 1: Web push (VAPID)
  try {
    await sendPushToCard(cardId, {
      title: payload.title,
      body: payload.body,
      url: `https://fidelizy.vercel.app/card/${qrCodeId}`,
    })
    sent.push('web_push')
  } catch (err) {
    console.error(`[NotificationService] Web push failed for card ${cardId}:`, err)
    failed.push('web_push')
  }

  // Channel 2: Apple Wallet (APNs)
  try {
    await notifyWalletDevices(qrCodeId)
    sent.push('apple_wallet')
  } catch (err) {
    console.error(`[NotificationService] Wallet push failed for card ${qrCodeId}:`, err)
    failed.push('apple_wallet')
  }

  // Channel 3: Google Wallet — placeholder for Epic 6
  // When implemented, add: await notifyGoogleWallet(qrCodeId)

  return { sent, failed }
}

/**
 * Broadcast notification to all clients of a business.
 */
export async function broadcastToBusinessClients(
  businessId: string,
  payload: NotificationPayload
): Promise<void> {
  await sendPushToAllBusinessClients(businessId, {
    title: payload.title,
    body: payload.body,
  })
}
