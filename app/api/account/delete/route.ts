import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { AppError, withErrorHandler } from '@/lib/errors'

export const DELETE = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) throw AppError.auth('Non autorisé')

  const serviceClient = createServiceClient()

  const { data: business } = await serviceClient
    .from('businesses')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!business) throw AppError.notFound('Commerce introuvable')

  // Supprimer les wallet_registrations liees aux cartes du commerce
  const { data: cards } = await serviceClient
    .from('loyalty_cards')
    .select('qr_code_id')
    .eq('business_id', user.id)

  if (cards && cards.length > 0) {
    const serialNumbers = cards.map((c) => c.qr_code_id)
    await serviceClient
      .from('wallet_registrations')
      .delete()
      .in('serial_number', serialNumbers)
      .throwOnError()
  }

  await serviceClient
    .from('businesses')
    .delete()
    .eq('id', user.id)
    .throwOnError()

  // Supprimer le compte Auth (best-effort)
  const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(user.id)
  if (authDeleteError) {
    console.error('Auth delete error:', authDeleteError.message)
  }

  return NextResponse.json({ success: true })
})
