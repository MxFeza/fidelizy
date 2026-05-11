import { generatePkpass } from '@/lib/wallet/generatePass'
import { NextResponse } from 'next/server'
import { AppError, withErrorHandler } from '@/lib/errors'

export const GET = withErrorHandler(async (_request, context) => {
  const { cardId } = await (context as { params: Promise<{ cardId: string }> }).params

  const buf = await generatePkpass(cardId)
  if (!buf) throw AppError.notFound('Carte introuvable')

  // iOS Safari routes the response to PassKit (Add to Apple Wallet) only when
  // served inline. `Content-Disposition: attachment` forces a download and
  // breaks the native install flow — keep it inline.
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': 'inline; filename="loyalty.pkpass"',
      'Cache-Control': 'no-store',
    },
  })
})
