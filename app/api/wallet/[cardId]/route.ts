import { generatePkpass } from '@/lib/wallet/generatePass'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params

  let buf: Buffer | null
  try {
    buf = await generatePkpass(cardId)
  } catch (err) {
    console.error('[wallet] generation error')
    return new NextResponse('Internal error', { status: 500 })
  }

  if (!buf) return new NextResponse('Not found', { status: 404 })

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': 'attachment; filename="loyalty.pkpass"',
    },
  })
}
