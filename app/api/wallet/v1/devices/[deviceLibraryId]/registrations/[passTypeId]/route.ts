import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

// GET — Apple asks which passes for this device have been updated since a given timestamp.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceLibraryId: string; passTypeId: string }> }
) {
  const { deviceLibraryId } = await params
  const raw = request.nextUrl.searchParams.get('passesUpdatedSince')
  // Apple sends "2026-03-01T17:21:36+00:00" but the + gets URL-decoded to a space.
  // Replace any space before the UTC offset back to + so PostgreSQL can parse it.
  const passesUpdatedSince = raw ? raw.replace(' ', '+') : null

  const supabase = createServiceClient()

  const { data: registrations, error: regError } = await supabase
    .from('wallet_registrations')
    .select('serial_number')
    .eq('device_library_id', deviceLibraryId)

  if (regError) {
    console.error('[WalletV1] error fetching registrations')
    return new NextResponse(null, { status: 500 })
  }

  if (!registrations || registrations.length === 0) {
    return new NextResponse(null, { status: 204 })
  }

  const serialNumbers = registrations.map((r) => r.serial_number)

  let query = supabase
    .from('loyalty_cards')
    .select('qr_code_id, updated_at')
    .in('qr_code_id', serialNumbers)

  if (passesUpdatedSince) {
    query = query.gt('updated_at', passesUpdatedSince)
  }

  const { data: updatedCards, error: cardError } = await query

  if (cardError) {
    console.error('[WalletV1] error fetching updated cards')
    // updated_at column might not exist yet — return 204 to avoid error loop
    return new NextResponse(null, { status: 204 })
  }

  if (!updatedCards || updatedCards.length === 0) {
    return new NextResponse(null, { status: 204 })
  }

  const lastUpdated = updatedCards.reduce(
    (latest, card) => (card.updated_at > latest ? card.updated_at : latest),
    updatedCards[0].updated_at
  )

  return NextResponse.json({
    serialNumbers: updatedCards.map((c) => c.qr_code_id),
    lastUpdated,
  })
}
