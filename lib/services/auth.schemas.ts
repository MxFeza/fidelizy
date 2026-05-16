import { z } from 'zod'

/**
 * sendOtp / verifyOtp accept EITHER phone OR email comme identifier customer.
 *
 * Cas d'usage :
 *  - Login depuis /me : seul phone est connu (le user tape son numéro)
 *  - Login inline depuis /join (4.2.b') : seul email est connu (carte
 *    attachée au compte existant via email lookup, le phone tapé sur
 *    le formulaire d'inscription peut être different de celui du customer)
 *
 * `.refine` impose qu'au moins l'un des deux soit fourni.
 */
export const sendOtpSchema = z
  .object({
    phone: z.string().trim().min(6).max(20).optional(),
    email: z.string().trim().email().toLowerCase().optional(),
  })
  .refine((d) => d.phone || d.email, {
    message: 'phone ou email requis',
  })
export type SendOtpInput = z.infer<typeof sendOtpSchema>

export const verifyOtpSchema = z
  .object({
    phone: z.string().trim().min(6).max(20).optional(),
    email: z.string().trim().email().toLowerCase().optional(),
    token: z.string().length(6),
  })
  .refine((d) => d.phone || d.email, {
    message: 'phone ou email requis',
  })
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>

export const addEmailSchema = z.object({
  phone: z.string().trim().min(6).max(20),
  email: z.string().trim().email().toLowerCase(),
})
export type AddEmailInput = z.infer<typeof addEmailSchema>

/**
 * Inscription client directe (sans QR commercant scanne).
 * Cf. /api/auth/register-direct.
 */
export const registerDirectSchema = z.object({
  first_name: z.string().trim().min(1, 'Prénom requis.').max(100),
  phone: z.string().trim().min(6, 'Numéro de téléphone requis.').max(20),
  email: z.string().trim().toLowerCase().email('Email valide requis.'),
})
export type RegisterDirectInput = z.infer<typeof registerDirectSchema>
