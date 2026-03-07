import { generatePkpass, verifyAuthToken, consumePendingAction } from '@/lib/wallet/generatePass'
import { NextRequest, NextResponse } from 'next/server'

// GET — Apple downloads the latest version of a pass after receiving a push notification.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ passTypeId: string; serialNumber: string }> }
) {
  const { passTypeId, serialNumber } = await params
  console.log(`[WalletV1] GET pass — passTypeId=${passTypeId} serialNumber=${serialNumber.slice(0, 8)}...`)

  const auth = request.headers.get('authorization')
  const token = auth?.startsWith('ApplePass ') ? auth.slice('ApplePass '.length) : null

  if (!token || !verifyAuthToken(token, serialNumber)) {
    console.error('[WalletV1] Auth token invalid — returning 401')
    return new NextResponse(null, { status: 401 })
  }

  console.log('[WalletV1] Auth OK — generating updated pkpass...')

  const pending = consumePendingAction(serialNumber)
  const passOptions = pending
    ? { action: pending.action, remainingForReward: pending.remainingForReward }
    : undefined

  let buf: Buffer | null
  try {
    buf = await generatePkpass(serialNumber, passOptions)
  } catch (err) {
    console.error('[WalletV1] generatePkpass error:', err)
    return new NextResponse(null, { status: 500 })
  }

  if (!buf) {
    console.error('[WalletV1] generatePkpass returned null (card not found?)')
    return new NextResponse(null, { status: 404 })
  }

  console.log(`[WalletV1] Sending updated pkpass (${buf.length} bytes)`)

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Last-Modified': new Date().toUTCString(),
    },
  })
}
