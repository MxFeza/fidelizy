import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AppError, withErrorHandler } from '@/lib/errors'
import JSZip from 'jszip'

export const dynamic = 'force-dynamic'

/**
 * Export RGPD du commercant (Story 8.3, FR48).
 * Genere un ZIP contenant des CSV: business, customers, transactions,
 * loyalty_cards, reward_tiers, reward_claims, referrals.
 */
export const GET = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) throw AppError.auth('Non autorisé')

  const service = createServiceClient()

  const [businessRes, cardsRes, transactionsRes, claimsRes, referralsRes] = await Promise.all([
    service.from('businesses').select('*').eq('id', user.id).single(),
    service.from('loyalty_cards').select('*').eq('business_id', user.id),
    service.from('transactions').select('*').eq('business_id', user.id).order('created_at', { ascending: false }),
    service.from('reward_claims').select('*, loyalty_cards!inner(business_id)').eq('loyalty_cards.business_id', user.id),
    service.from('referrals').select('*').eq('business_id', user.id),
  ])

  if (!businessRes.data) throw AppError.notFound('Commerce introuvable')

  // Fetch customers en deuxieme passe pour eviter le mapping ambigu de la jointure Supabase
  const customerIds = Array.from(new Set((cardsRes.data ?? []).map((c) => c.customer_id).filter(Boolean)))
  const customers = customerIds.length > 0
    ? (await service.from('customers').select('*').in('id', customerIds)).data ?? []
    : []

  const zip = new JSZip()
  zip.file('business.csv', toCSV([businessRes.data]))
  zip.file('customers.csv', toCSV(customers))
  zip.file('loyalty_cards.csv', toCSV(cardsRes.data ?? []))
  zip.file('transactions.csv', toCSV(transactionsRes.data ?? []))
  zip.file('reward_claims.csv', toCSV(claimsRes.data ?? []))
  zip.file('referrals.csv', toCSV(referralsRes.data ?? []))
  zip.file('README.txt', readmeText(businessRes.data.business_name as string))

  const buf = await zip.generateAsync({ type: 'uint8array' })

  const date = new Date().toISOString().slice(0, 10)
  const slug = (businessRes.data.business_name as string)
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
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','))
  }
  return lines.join('\n')
}

function readmeText(businessName: string): string {
  return [
    `Export des donnees Izou — ${businessName}`,
    `Genere le ${new Date().toISOString()}`,
    '',
    'Contenu :',
    '- business.csv     : configuration de votre commerce',
    '- customers.csv    : clients inscrits a votre programme',
    '- loyalty_cards.csv: cartes de fidelite et soldes',
    '- transactions.csv : historique des tampons/points',
    '- reward_claims.csv: recompenses reclamees',
    '- referrals.csv    : parrainages effectues',
    '',
    'Cet export a ete genere conformement a votre droit a la portabilite (RGPD art. 20).',
  ].join('\n')
}
