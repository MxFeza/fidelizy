import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AppError, withErrorHandler } from '@/lib/errors'

/**
 * POST /api/me/onboarding/wallet-added — marque la carte comme ajoutée au Wallet.
 *
 * Idempotent : si `wallet_added_at` est déjà set, on ne le réécrit pas.
 * Story 9.2.
 */
export const POST = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || !user.email || authError) throw AppError.auth('Non autorisé')

  const service = createServiceClient()
  const { data: customer } = await service
    .from('customers')
    .select('id, wallet_added_at')
    .eq('email', user.email)
    .maybeSingle()
  if (!customer) throw AppError.notFound('Profil introuvable')

  if (customer.wallet_added_at) {
    return NextResponse.json({ ok: true, wallet_added_at: customer.wallet_added_at })
  }

  const now = new Date().toISOString()
  const { error } = await service
    .from('customers')
    .update({ wallet_added_at: now })
    .eq('id', customer.id)
  if (error) throw new AppError('Erreur lors de la mise à jour', 500)

  return NextResponse.json({ ok: true, wallet_added_at: now })
})
