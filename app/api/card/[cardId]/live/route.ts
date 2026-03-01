import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

// Lightweight polling endpoint — returns only the mutable fields of a loyalty card.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params
  const supabase = createServiceClient()

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('current_stamps, current_points')
    .eq('qr_code_id', cardId)
    .single()

  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(
    { stamps: card.current_stamps ?? 0, points: card.current_points ?? 0 },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
