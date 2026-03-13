import { SupabaseClient } from '@supabase/supabase-js'

export async function atomicIncrementPoints(
  supabase: SupabaseClient,
  cardId: string,
  amount: number
): Promise<number> {
  const { data, error } = await supabase.rpc('increment_points', {
    p_card_id: cardId,
    p_amount: amount,
  })
  if (error) throw new Error(`increment_points failed: ${error.message}`)
  return data as number
}

export async function atomicIncrementStamps(
  supabase: SupabaseClient,
  cardId: string,
  amount: number
): Promise<number> {
  const { data, error } = await supabase.rpc('increment_stamps', {
    p_card_id: cardId,
    p_amount: amount,
  })
  if (error) throw new Error(`increment_stamps failed: ${error.message}`)
  return data as number
}

export async function atomicDeductPointsSafe(
  supabase: SupabaseClient,
  cardId: string,
  amount: number
): Promise<{ success: boolean; newBalance: number }> {
  const { data, error } = await supabase.rpc('deduct_points_safe', {
    p_card_id: cardId,
    p_amount: amount,
  })
  if (error) throw new Error(`deduct_points_safe failed: ${error.message}`)
  const balance = data as number
  return { success: balance >= 0, newBalance: Math.max(0, balance) }
}
