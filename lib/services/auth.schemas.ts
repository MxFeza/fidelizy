import { z } from 'zod'

export const sendOtpSchema = z.object({
  phone: z.string().trim().min(6).max(20),
})
export type SendOtpInput = z.infer<typeof sendOtpSchema>

export const verifyOtpSchema = z.object({
  phone: z.string().trim().min(6).max(20),
  token: z.string().length(6),
})
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>

export const addEmailSchema = z.object({
  phone: z.string().trim().min(6).max(20),
  email: z.string().trim().email().toLowerCase(),
})
export type AddEmailInput = z.infer<typeof addEmailSchema>
