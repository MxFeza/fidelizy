import { generatePkpass, verifyAuthToken } from '@/lib/wallet/generatePass'
import { NextRequest, NextResponse } from 'next/server'

// GET — Apple downloads the latest version of a pass after receiving a push notification.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ passTypeId: string; serialNumber: string }> }
) {
  const { serialNumber } = await params

  const auth = request.headers.get('authorization')
  const token = auth?.startsWith('ApplePass ') ? auth.slice('ApplePass '.length) : null

  if (!token || !verifyAuthToken(token, serialNumber)) {
    return new NextResponse(null, { status: 401 })
  }

  let buf: Buffer | null
  try {
    buf = await generatePkpass(serialNumber)
  } catch (err) {
    console.error('Wallet update generation error:', err)
    return new NextResponse(null, { status: 500 })
  }

  if (!buf) return new NextResponse(null, { status: 404 })

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Last-Modified': new Date().toUTCString(),
    },
  })
}
