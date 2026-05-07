import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AppError, withErrorHandler } from '@/lib/errors'
import { getCustomerAvatarUrl } from '@/lib/assets'
import { cardWriteLimiter, getIP } from '@/lib/ratelimit'

const BUCKET = 'customer-avatars'
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
}

/**
 * POST /api/me/avatar — upload avatar customer (Story 4.7 v2).
 * Body : multipart/form-data { file: File }
 * Auth via cookie SSR. Path: customer-avatars/{customer_id}/avatar.{ext}
 * Cleanup old avatars + cache-bust ?v=ts.
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || !user.email || authError) throw AppError.auth('Non autorisé')

  const ip = getIP(request)
  const { success } = await cardWriteLimiter.limit(`avatar:${user.id}:${ip}`)
  if (!success) throw AppError.rateLimit('Trop de tentatives. Réessayez dans une minute.')

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) throw AppError.validation('Fichier manquant.')
  if (!ALLOWED_MIME.has(file.type)) {
    throw AppError.validation('Format non supporté. Utilisez PNG, JPG ou WebP.')
  }
  if (file.size > MAX_BYTES) {
    throw AppError.validation('Fichier trop volumineux (max 2 MB).')
  }

  const service = createServiceClient()
  const { data: customer, error: customerError } = await service
    .from('customers')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()
  if (customerError || !customer) throw AppError.notFound('Profil introuvable')

  const ext = EXT_BY_MIME[file.type] ?? 'png'
  const path = `${customer.id}/avatar.${ext}`

  // Cleanup old avatars (any extension) avant l'upload
  const { data: existing } = await service.storage.from(BUCKET).list(customer.id)
  if (existing && existing.length > 0) {
    const toRemove = existing
      .filter((entry) => entry.name.startsWith('avatar.'))
      .map((entry) => `${customer.id}/${entry.name}`)
    if (toRemove.length > 0) {
      await service.storage.from(BUCKET).remove(toRemove)
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadError } = await service.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: '3600',
    })
  if (uploadError) {
    console.error('Avatar upload error:', uploadError)
    throw new AppError('Erreur lors de l\'upload.', 500)
  }

  const publicUrl = `${getCustomerAvatarUrl(path)}?v=${Date.now()}`

  const { error: updateError } = await service
    .from('customers')
    .update({ avatar_url: publicUrl })
    .eq('id', customer.id)
  if (updateError) {
    console.error('Avatar DB update error:', updateError)
    throw new AppError('Upload réussi mais sauvegarde échouée.', 500)
  }

  return NextResponse.json({ success: true, url: publicUrl })
})

/**
 * DELETE /api/me/avatar — supprime l'avatar customer.
 */
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || !user.email || authError) throw AppError.auth('Non autorisé')

  const service = createServiceClient()
  const { data: customer } = await service
    .from('customers')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()
  if (!customer) throw AppError.notFound('Profil introuvable')

  const { data: existing } = await service.storage.from(BUCKET).list(customer.id)
  if (existing && existing.length > 0) {
    const toRemove = existing
      .filter((entry) => entry.name.startsWith('avatar.'))
      .map((entry) => `${customer.id}/${entry.name}`)
    if (toRemove.length > 0) {
      await service.storage.from(BUCKET).remove(toRemove)
    }
  }

  await service
    .from('customers')
    .update({ avatar_url: null })
    .eq('id', customer.id)
    .throwOnError()

  return NextResponse.json({ success: true })
})
