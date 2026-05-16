import { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '@/lib/errors'
import type { SendOtpInput, VerifyOtpInput, AddEmailInput } from './auth.schemas'

/**
 * Lookup du customer par email (priorité) ou par phone. Le schéma garantit
 * qu'au moins un des deux est fourni.
 */
async function lookupCustomer(
  supabase: SupabaseClient,
  params: { phone?: string; email?: string }
): Promise<{ id: string; email: string | null } | null> {
  if (params.email) {
    const { data } = await supabase
      .from('customers')
      .select('id, email')
      .eq('email', params.email.trim().toLowerCase())
      .maybeSingle()
    if (data) return data
  }
  if (params.phone) {
    const { data } = await supabase
      .from('customers')
      .select('id, email')
      .eq('phone', params.phone.trim())
      .maybeSingle()
    if (data) return data
  }
  return null
}

/**
 * Send OTP to customer's email (looked up by phone OR email).
 * Returns status: 'otp_sent' | 'not_found' | 'needs_email'
 */
export async function sendOtp(
  supabase: SupabaseClient,
  supabaseAuth: SupabaseClient,
  params: SendOtpInput
): Promise<{ status: string; email?: string; maskedEmail?: string }> {
  const customer = await lookupCustomer(supabase, params)

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
    throw new AppError("Erreur lors de l'envoi du code.", 500)
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
 * Verify OTP by phone OR email. Looks up customer + verifies token against
 * their email (which is what Supabase Auth sent the OTP to). Returns the
 * list of cards on success.
 */
export async function verifyOtp(
  supabase: SupabaseClient,
  supabaseAuth: SupabaseClient,
  params: VerifyOtpInput
): Promise<{ status: string; cards?: Record<string, unknown>[] }> {
  const customer = await lookupCustomer(supabase, params)

  if (!customer || !customer.email) {
    return { status: 'invalid' }
  }

  const { error } = await supabaseAuth.auth.verifyOtp({
    email: customer.email,
    token: params.token,
    type: 'email',
  })

  if (error) {
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
 *
 * Sécurité (audit local 2026-05-08, finding T1-2) : refuse d'écraser un
 * email existant. Sans ce garde-fou, un attaquant qui connaît le phone
 * d'une victime peut overwrite son email avec le sien et recevoir l'OTP
 * → takeover du compte. Si l'utilisateur a perdu accès à son email, il
 * doit passer par le support (pas par cette route auto-service).
 */
export async function addEmailAndSendOtp(
  supabase: SupabaseClient,
  supabaseAuth: SupabaseClient,
  params: AddEmailInput
): Promise<{ status: string }> {
  const { phone, email } = params
  const phoneTrim = phone.trim()
  const emailLower = email.trim().toLowerCase()

  // Vérifie qu'aucun email n'est déjà associé à ce phone
  const { data: existing } = await supabase
    .from('customers')
    .select('email')
    .eq('phone', phoneTrim)
    .maybeSingle()

  if (!existing) {
    throw new AppError('Compte introuvable.', 404)
  }
  if (existing.email && existing.email.toLowerCase() !== emailLower) {
    throw new AppError(
      'Un email est déjà associé à ce compte. Connectez-vous avec votre email habituel ou contactez le support.',
      409,
    )
  }

  // Idempotent : si même email, on ne fait que renvoyer l'OTP
  if (!existing.email) {
    const { error: updateError } = await supabase
      .from('customers')
      .update({ email: emailLower })
      .eq('phone', phoneTrim)

    if (updateError) {
      throw new AppError('Erreur lors de la mise à jour.', 500)
    }
  }

  const { error: otpError } = await supabaseAuth.auth.signInWithOtp({
    email: emailLower,
    options: { shouldCreateUser: true },
  })

  if (otpError) {
    console.error('signInWithOtp error:', otpError.message, otpError.status)
    throw new AppError("Erreur lors de l'envoi du code.", 500)
  }

  return { status: 'otp_sent' }
}
