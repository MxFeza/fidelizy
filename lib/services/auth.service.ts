import { SupabaseClient } from '@supabase/supabase-js'
import { ServiceError } from './loyalty.service'
import type { SendOtpInput, VerifyOtpInput, AddEmailInput } from './auth.schemas'

/**
 * Send OTP to customer's email (looked up by phone).
 * Returns status: 'otp_sent' | 'not_found' | 'needs_email'
 *
 * @param supabase - Service client for DB queries (bypass RLS)
 * @param supabaseAuth - Anon key client for Auth operations
 */
export async function sendOtp(
  supabase: SupabaseClient,
  supabaseAuth: SupabaseClient,
  params: SendOtpInput
): Promise<{ status: string; email?: string; maskedEmail?: string }> {
  const { phone } = params

  const { data: customer } = await supabase
    .from('customers')
    .select('id, email')
    .eq('phone', phone.trim())
    .maybeSingle()

  if (!customer) {
    return { status: 'not_found' }
  }

  if (!customer.email) {
    return { status: 'needs_email' }
  }

  const { error } = await supabaseAuth.auth.signInWithOtp({
    email: customer.email,
    options: { shouldCreateUser: true },
  })

  if (error) {
    console.error('signInWithOtp error:', error.message, error.status)
    throw new ServiceError("Erreur lors de l'envoi du code.", 500)
  }

  // Mask email for display: j***n@gmail.com
  const [localPart, domain] = customer.email.split('@')
  const masked = localPart.length <= 2
    ? localPart[0] + '***'
    : localPart[0] + '***' + localPart[localPart.length - 1]
  const maskedEmail = `${masked}@${domain}`

  return { status: 'otp_sent', email: customer.email, maskedEmail }
}

/**
 * Verify OTP and return customer cards.
 */
export async function verifyOtp(
  supabase: SupabaseClient,
  supabaseAuth: SupabaseClient,
  params: VerifyOtpInput
): Promise<{ status: string; cards?: Record<string, unknown>[] }> {
  const { email, token } = params

  const { error } = await supabaseAuth.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    return { status: 'invalid' }
  }

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (!customer) {
    return { status: 'invalid' }
  }

  const { data: cards } = await supabase
    .from('loyalty_cards')
    .select('id, qr_code_id, current_stamps, current_points, businesses(business_name, loyalty_type, stamps_required, primary_color)')
    .eq('customer_id', customer.id)

  return { status: 'verified', cards: cards ?? [] }
}

/**
 * Add email to customer (by phone) and send OTP.
 */
export async function addEmailAndSendOtp(
  supabase: SupabaseClient,
  supabaseAuth: SupabaseClient,
  params: AddEmailInput
): Promise<{ status: string }> {
  const { phone, email } = params

  const { error: updateError } = await supabase
    .from('customers')
    .update({ email })
    .eq('phone', phone.trim())

  if (updateError) {
    throw new ServiceError('Erreur lors de la mise à jour.', 500)
  }

  const { error: otpError } = await supabaseAuth.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  })

  if (otpError) {
    console.error('signInWithOtp error:', otpError.message, otpError.status)
    throw new ServiceError("Erreur lors de l'envoi du code.", 500)
  }

  return { status: 'otp_sent' }
}
