import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

// GET — Apple asks which passes for this device have been updated since a given timestamp.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceLibraryId: string; passTypeId: string }> }
) {
  const { deviceLibraryId, passTypeId } = await params
  const passesUpdatedSince = request.nextUrl.searchParams.get('passesUpdatedSince')

  console.log(`[WalletV1] GET registrations — device=${deviceLibraryId.slice(0, 8)}... passTypeId=${passTypeId} updatedSince=${passesUpdatedSince ?? 'none'}`)

  const supabase = createServiceClient()

  const { data: registrations, error: regError } = await supabase
    .from('wallet_registrations')
    .select('serial_number')
    .eq('device_library_id', deviceLibraryId)

  if (regError) {
    console.error('[WalletV1] Supabase error fetching registrations:', regError.message)
    return new NextResponse(null, { status: 500 })
  }

  if (!registrations || registrations.length === 0) {
    console.log('[WalletV1] No registrations for this device — 204')
    return new NextResponse(null, { status: 204 })
  }

  const serialNumbers = registrations.map((r) => r.serial_number)
  console.log(`[WalletV1] Device has ${serialNumbers.length} registered pass(es)`)

  let query = supabase
    .from('loyalty_cards')
    .select('qr_code_id, updated_at')
    .in('qr_code_id', serialNumbers)

  if (passesUpdatedSince) {
    query = query.gt('updated_at', passesUpdatedSince)
  }

  const { data: updatedCards, error: cardError } = await query

  if (cardError) {
    console.error('[WalletV1] Supabase error fetching updated cards:', cardError.message)
    // updated_at column might not exist yet — return 204 to avoid error loop
    return new NextResponse(null, { status: 204 })
  }

  if (!updatedCards || updatedCards.length === 0) {
    console.log('[WalletV1] No updated passes since last check — 204')
    return new NextResponse(null, { status: 204 })
  }

  const lastUpdated = updatedCards.reduce(
    (latest, card) => (card.updated_at > latest ? card.updated_at : latest),
    updatedCards[0].updated_at
  )

  console.log(`[WalletV1] ${updatedCards.length} updated pass(es) — returning serialNumbers`)

  return NextResponse.json({
    serialNumbers: updatedCards.map((c) => c.qr_code_id),
    lastUpdated,
  })
}
