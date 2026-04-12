import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { AppError, withErrorHandler } from '@/lib/errors'

export const GET = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw AppError.auth('Non authentifié')

  const { data: topClients } = await supabase
    .from('loyalty_cards')
    .select('id, total_visits, last_visit_at, current_stamps, current_points, customers(first_name, phone)')
    .eq('business_id', user.id)
    .order('total_visits', { ascending: false })
    .limit(3)

  return NextResponse.json({ topClients: topClients ?? [] })
})
