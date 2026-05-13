import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AppError, withErrorHandler } from '@/lib/errors'

/**
 * GET /api/business/claim-requests
 *
 * Liste les demandes de récompense pending du merchant connecté, du plus
 * récent au plus ancien. Sert le widget "Demandes de récompenses" du
 * dashboard, qui permet au merchant de valider en 1 clic (au lieu de
 * scanner/taper le code 6 chars présenté par le client).
 *
 * Le code 6 chars reste actif comme fallback (cas où la connexion réseau
 * du merchant ne charge pas la liste mais celle du client a généré le code).
 *
 * Filtre côté serveur : status='pending' ET expires_at > now() (les
 * demandes expirées sont nettoyées par le cron mais on garde la guard
 * pour l'affichage immédiat).
 */
export const GET = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) throw AppError.auth('Non autorisé')

  // Verifie que l'user est bien un commerce
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', user.id)
    .single()
  if (!business) throw AppError.notFound('Commerce introuvable')

  // Lecture en service_role pour respecter le pattern TD-001 Option C.
  // Le filtre business_id = merchant garantit le scope.
  const service = createServiceClient()
  const { data: rows, error } = await service
    .from('claim_requests')
    .select(`
      id, code, reward_name, points_cost, loyalty_type, created_at, expires_at,
      loyalty_cards!inner(qr_code_id, customers(first_name, last_name))
    `)
    .eq('business_id', business.id)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new AppError('Erreur lors du chargement des demandes', 500)

  const requests = (rows ?? []).map((row) => {
    const card = row.loyalty_cards as unknown as {
      qr_code_id: string
      customers: { first_name: string | null; last_name: string | null } | null
    }
    return {
      id: row.id,
      code: row.code,
      rewardName: row.reward_name,
      pointsCost: row.points_cost,
      loyaltyType: row.loyalty_type as 'stamps' | 'points',
      cardId: card.qr_code_id,
      customerName: card.customers?.first_name
        ? `${card.customers.first_name}${card.customers.last_name ? ' ' + card.customers.last_name : ''}`
        : 'Client',
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    }
  })

  return NextResponse.json({ requests })
})
