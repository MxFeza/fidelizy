import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

// GET — Apple asks which passes for this device have been updated since a given timestamp.
// Apple passes ?passesUpdatedSince=<lastUpdated tag> from our previous response.
// We return serial numbers of passes updated since that time.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceLibraryId: string; passTypeId: string }> }
) {
  const { deviceLibraryId } = await params
  const passesUpdatedSince = request.nextUrl.searchParams.get('passesUpdatedSince')

  const supabase = createServiceClient()

  // Find all serial numbers registered to this device
  const { data: registrations } = await supabase
    .from('wallet_registrations')
    .select('serial_number')
    .eq('device_library_id', deviceLibraryId)

  if (!registrations || registrations.length === 0) {
    return new NextResponse(null, { status: 204 })
  }

  const serialNumbers = registrations.map((r) => r.serial_number)

  // Find which loyalty cards have been updated since the given timestamp
  let query = supabase
    .from('loyalty_cards')
    .select('qr_code_id, updated_at')
    .in('qr_code_id', serialNumbers)

  if (passesUpdatedSince) {
    query = query.gt('updated_at', passesUpdatedSince)
  }

  const { data: updatedCards } = await query

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
