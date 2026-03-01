import { connect } from 'http2'
import { createServiceClient } from '@/lib/supabase/service'

const PASS_TYPE_ID = process.env.APPLE_PASS_TYPE_ID!

function sendWalletPush(pushToken: string, certPem: string, keyPem: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = connect('https://api.push.apple.com', { cert: certPem, key: keyPem })

    client.on('error', (err) => {
      client.destroy()
      reject(err)
    })

    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${pushToken}`,
      'apns-topic': PASS_TYPE_ID,
      'apns-push-type': 'background',
      'content-type': 'application/json',
      'content-length': '2',
    })

    req.on('response', (headers) => {
      const status = headers[':status'] as number
      client.close()
      if (status === 200) resolve()
      else reject(new Error(`APNs returned ${status} for token ${pushToken.slice(0, 8)}...`))
    })

    req.on('error', (err) => {
      client.destroy()
      reject(err)
    })

    req.end('{}')
  })
}

/**
 * Looks up all wallet devices registered for the given card (by qrCodeId)
 * and sends a silent APNs push to trigger a pass update on each device.
 * Errors are logged but never thrown — this is fire-and-forget.
 */
export async function notifyWalletDevices(qrCodeId: string): Promise<void> {
  const supabase = createServiceClient()

  const { data: registrations } = await supabase
    .from('wallet_registrations')
    .select('push_token')
    .eq('serial_number', qrCodeId)

  if (!registrations || registrations.length === 0) return

  const certPem = Buffer.from(process.env.APPLE_PASS_CERT_B64!, 'base64').toString()
  const keyPem = Buffer.from(process.env.APPLE_PASS_KEY_B64!, 'base64').toString()

  const results = await Promise.allSettled(
    registrations.map(({ push_token }) => sendWalletPush(push_token, certPem, keyPem))
  )

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`Wallet push failed for registration ${i}:`, r.reason)
    }
  })
}
