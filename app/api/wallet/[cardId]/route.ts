import { generatePkpass } from '@/lib/wallet/generatePass'
import { NextResponse } from 'next/server'
import { AppError, withErrorHandler } from '@/lib/errors'

export const GET = withErrorHandler(async (_request, context) => {
  const { cardId } = await (context as { params: Promise<{ cardId: string }> }).params

  const buf = await generatePkpass(cardId)
  if (!buf) throw AppError.notFound('Carte introuvable')

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': 'attachment; filename="loyalty.pkpass"',
    },
  })
})
