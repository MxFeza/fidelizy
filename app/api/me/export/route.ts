import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AppError, withErrorHandler } from '@/lib/errors'
import JSZip from 'jszip'

export const dynamic = 'force-dynamic'

/**
 * Export RGPD du client (Story 4.7 P1, RGPD art. 20 — droit à la portabilité).
 * Genere un ZIP contenant des CSV : profil, cartes, transactions, recompenses
 * réclamées, parrainages.
 */
export const GET = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || !user.email || authError) throw AppError.auth('Non autorisé')

  const service = createServiceClient()

  const { data: customer } = await service
    .from('customers')
    .select('*')
    .eq('email', user.email)
    .maybeSingle()
  if (!customer) throw AppError.notFound('Profil introuvable')

  const customerId = customer.id as string

  const [cardsRes, transactionsRes, claimsRes, referralsRes] = await Promise.all([
    service
      .from('loyalty_cards')
      .select('*, businesses(business_name, loyalty_type)')
      .eq('customer_id', customerId),
    service
      .from('transactions')
      .select('*, loyalty_cards!inner(customer_id)')
      .eq('loyalty_cards.customer_id', customerId)
      .order('created_at', { ascending: false }),
    service
      .from('reward_claims')
      .select('*, loyalty_cards!inner(customer_id)')
      .eq('loyalty_cards.customer_id', customerId),
    service.from('referrals').select('*').eq('referrer_customer_id', customerId),
  ])

  const zip = new JSZip()
  zip.file('profile.csv', toCSV([customer]))
  zip.file('loyalty_cards.csv', toCSV(cardsRes.data ?? []))
  zip.file('transactions.csv', toCSV(transactionsRes.data ?? []))
  zip.file('reward_claims.csv', toCSV(claimsRes.data ?? []))
  zip.file('referrals.csv', toCSV(referralsRes.data ?? []))
  zip.file('README.txt', readmeText(customer.first_name as string))

  const buf = await zip.generateAsync({ type: 'uint8array' })

  const date = new Date().toISOString().slice(0, 10)
  const slug = (customer.first_name as string)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'export'

  return new Response(buf as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="izou-${slug}-${date}.zip"`,
      'Cache-Control': 'no-store',
    },
  })
})

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k))
      return set
    }, new Set<string>())
  )

  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return ''
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
    if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`
    return str
  }

  const lines = [headers.join(',')]
  for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(','))
  return lines.join('\n')
}

function readmeText(firstName: string): string {
  return [
    `Export des donnees Izou — ${firstName}`,
    `Genere le ${new Date().toISOString()}`,
    '',
    'Contenu :',
    '- profile.csv       : vos informations de compte',
    '- loyalty_cards.csv : vos cartes de fidelite et soldes',
    '- transactions.csv  : historique des tampons/points',
    '- reward_claims.csv : recompenses reclamees',
    '- referrals.csv     : parrainages effectues',
    '',
    'Cet export a ete genere conformement a votre droit a la portabilite (RGPD art. 20).',
  ].join('\n')
}
