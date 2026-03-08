import { SupabaseClient } from '@supabase/supabase-js'

export function generateReferralCode(firstName: string, phone: string): string {
  const prefix = firstName.substring(0, 4).toUpperCase().padEnd(4, 'X')
  const suffix = phone.slice(-4)
  return `${prefix}-${suffix}`
}

export async function findCardByReferralCode(
  code: string,
  businessId: string,
  supabase: SupabaseClient
): Promise<{ id: string; customer_id: string } | null> {
  const parts = code.split('-')
  if (parts.length !== 2 || parts[0].length < 1 || parts[1].length !== 4) {
    return null
  }

  const namePrefix = parts[0]
  const phoneSuffix = parts[1]

  // Find cards for this business where the customer matches
  const { data: cards } = await supabase
    .from('loyalty_cards')
    .select('id, customer_id, customers!inner(first_name, phone)')
    .eq('business_id', businessId)
    .eq('is_active', true)

  if (!cards?.length) return null

  for (const card of cards) {
    const customer = card.customers as unknown as { first_name: string; phone: string }
    if (!customer) continue

    const expectedPrefix = customer.first_name.substring(0, 4).toUpperCase().padEnd(4, 'X')
    const expectedSuffix = customer.phone.slice(-4)

    if (expectedPrefix === namePrefix && expectedSuffix === phoneSuffix) {
      return { id: card.id, customer_id: card.customer_id }
    }
  }

  return null
}
