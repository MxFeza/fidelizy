import { generatePkpass } from '@/lib/wallet/generatePass'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params

  try {
    const buf = await generatePkpass(cardId)
    if (!buf) return new NextResponse('Not found', { status: 404 })

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': 'attachment; filename="loyalty.pkpass"',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[${new Date().toISOString()}] Wallet generation error: ${message}`)
    return new NextResponse('Internal error', { status: 500 })
  }
}
