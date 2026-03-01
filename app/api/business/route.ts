import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const shortCode = request.nextUrl.searchParams.get('short_code')

  if (!shortCode) {
    return NextResponse.json({ error: 'Paramètre short_code requis' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('short_code', shortCode.toUpperCase())
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 })
  }

  return NextResponse.json({ id: business.id })
}
