import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { AppError, withErrorHandler } from '@/lib/errors'

export const GET = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw AppError.auth('Non authentifié')

  const days: { label: string; count: number }[] = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', user.id)
      .eq('type', 'earn')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())

    days.push({
      label: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
      count: count ?? 0,
    })
  }

  return NextResponse.json({ days })
})
