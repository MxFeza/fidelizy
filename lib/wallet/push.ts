import { connect } from 'http2'
import { createServiceClient } from '@/lib/supabase/service'

const PASS_TYPE_ID = process.env.APPLE_PASS_TYPE_ID!

function sendWalletPush(pushToken: string, certPem: string, keyPem: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`[WalletPush] Connecting to APNs for token ${pushToken.slice(0, 8)}...`)

    const client = connect('https://api.push.apple.com', { cert: certPem, key: keyPem })

    client.on('error', (err) => {
      console.error('[WalletPush] HTTP/2 client error:', err.message)
      client.destroy()
      reject(err)
    })

    client.on('connect', () => {
      console.log('[WalletPush] HTTP/2 connected to APNs')
    })

    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${pushToken}`,
      'apns-topic': PASS_TYPE_ID,
      // No apns-push-type for wallet passes (background is for app notifications)
      'content-type': 'application/json',
      'content-length': '2',
    })

    let responseData = ''

    req.on('response', (headers) => {
      const status = headers[':status'] as number
      console.log(`[WalletPush] APNs responded: HTTP ${status}`)
      req.on('data', (chunk: Buffer) => { responseData += chunk.toString() })
      req.on('end', () => {
        client.close()
        if (responseData) console.log('[WalletPush] APNs body:', responseData)
        if (status === 200) resolve()
        else reject(new Error(`APNs HTTP ${status} — ${responseData}`))
      })
    })

    req.on('error', (err) => {
      console.error('[WalletPush] Request error:', err.message)
      client.destroy()
      reject(err)
    })

    req.end('{}')
  })
}

/**
 * Looks up all wallet devices registered for the given card (by qrCodeId)
 * and sends a silent APNs push to trigger a pass update on each device.
 */
export async function notifyWalletDevices(qrCodeId: string): Promise<void> {
  console.log(`[WalletPush] notifyWalletDevices called for card ${qrCodeId.slice(0, 8)}...`)

  const supabase = createServiceClient()

  const { data: registrations, error } = await supabase
    .from('wallet_registrations')
    .select('push_token')
    .eq('serial_number', qrCodeId)

  if (error) {
    console.error('[WalletPush] Supabase error fetching registrations:', error.message)
    return
  }

  if (!registrations || registrations.length === 0) {
    console.log('[WalletPush] No wallet registrations found for this card — skipping push')
    return
  }

  console.log(`[WalletPush] Found ${registrations.length} registered device(s) — sending push...`)

  const certPem = Buffer.from(process.env.APPLE_PASS_CERT_B64!, 'base64').toString()
  const keyPem = Buffer.from(process.env.APPLE_PASS_KEY_B64!, 'base64').toString()

  const results = await Promise.allSettled(
    registrations.map(({ push_token }) => sendWalletPush(push_token, certPem, keyPem))
  )

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      console.log(`[WalletPush] Push ${i + 1} sent successfully`)
    } else {
      console.error(`[WalletPush] Push ${i + 1} failed:`, r.reason)
    }
  })
}
