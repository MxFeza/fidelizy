import { NextRequest, NextResponse } from 'next/server'

// Apple Wallet sends error logs here. Just log them for debugging.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (Array.isArray(body.logs)) {
      body.logs.forEach((msg: string) => console.log('[Apple Wallet]', msg))
    }
  } catch {
    // ignore malformed body
  }
  return new NextResponse(null, { status: 200 })
}
