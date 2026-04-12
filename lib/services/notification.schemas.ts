import { z } from 'zod'

export const notificationEventSchema = z.enum([
  'stamp_added',
  'reward_reached',
  'referral_success',
  'welcome',
  'broadcast',
  'inactive_reminder',
])
export type NotificationEvent = z.infer<typeof notificationEventSchema>

export const notificationPayloadSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(200),
  data: z.record(z.string(), z.unknown()).optional(),
})
export type NotificationPayload = z.infer<typeof notificationPayloadSchema>
