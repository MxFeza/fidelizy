import { createClient as createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { AppError, withErrorHandler } from '@/lib/errors'
import { joinLimiter, getIP } from '@/lib/ratelimit'
import { registerDirectSchema } from '@/lib/services/auth.schemas'

/**
 * Inscription client directe (sans avoir scanne un QR commercant).
 * Le client peut creer son compte global avant d'ajouter une premiere
 * carte fidelite via Story 4.10.b ("+ Ajouter une carte").
 *
 * Body : { first_name, phone, email }
 *
 * Comportement :
 *  - Si phone OU email deja en base -> retourne `already_exists` avec
 *    le maskedEmail pour login. Pas de creation duplicate.
 *  - Sinon : INSERT customer (sans business_id ni loyalty_card) + envoie
 *    OTP par email (Supabase Auth signInWithOtp).
 */
export const POST = withErrorHandler(async (request) => {
  const rl = await joinLimiter.limit(getIP(request))
  if (!rl.success) {
    throw new AppError('Trop de tentatives. Réessayez dans une minute.', 429)
  }

  const body = await request.json().catch(() => ({}))
  const parsed = registerDirectSchema.safeParse(body)
  if (!parsed.success) {
    throw AppError.validation(parsed.error.issues[0]?.message ?? 'Données invalides.')
  }
  const { first_name, phone, email } = parsed.data

  const service = createServiceClient()

  // Check if a customer already exists by phone OR email
  const { data: existingByPhone } = await service
    .from('customers')
    .select('id, email, phone')
    .eq('phone', phone)
    .maybeSingle()

  const { data: existingByEmail } = await service
    .from('customers')
    .select('id, email, phone')
    .eq('email', email)
    .maybeSingle()

  const existing = existingByPhone || existingByEmail

  if (existing) {
    // Already a client — trigger OTP login flow
    const supabaseAuth = await createServerClient()
    const targetEmail = existing.email ?? email
    const { error } = await supabaseAuth.auth.signInWithOtp({
      email: targetEmail,
      options: { shouldCreateUser: true },
    })
    if (error) {
      console.error('signInWithOtp (existing) error:', error.message)
      throw new AppError("Erreur lors de l'envoi du code.", 500)
    }
    const masked = maskEmail(targetEmail)
    return NextResponse.json({
      status: 'already_exists',
      message: 'Un compte existe déjà avec ces informations. Connectez-vous avec le code reçu.',
      maskedEmail: masked,
      // PII : on ne renvoie PAS le phone du compte existant (audit Gemini T1.2 :
      // énumération possible si l'attaquant essaie un email connu).
    })
  }

  // Insert new customer
  const { error: insertError } = await service
    .from('customers')
    .insert({ first_name, phone, email })

  if (insertError) {
    console.error('Customer insert error:', insertError)
    throw new AppError("Erreur lors de la création du compte.", 500)
  }

  // Send OTP
  const supabaseAuth = await createServerClient()
  const { error: otpError } = await supabaseAuth.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  })
  if (otpError) {
    console.error('signInWithOtp (new) error:', otpError.message)
    throw new AppError("Compte créé mais l'envoi du code a échoué. Réessayez via Connexion.", 500)
  }

  return NextResponse.json({
    status: 'otp_sent',
    maskedEmail: maskEmail(email),
    phone,
  })
})

function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return email
  const masked = localPart.length <= 2
    ? localPart[0] + '***'
    : localPart[0] + '***' + localPart[localPart.length - 1]
  return `${masked}@${domain}`
}
