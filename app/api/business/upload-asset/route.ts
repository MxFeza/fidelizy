import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AppError, withErrorHandler } from '@/lib/errors'
import { getBusinessAssetUrl } from '@/lib/assets'

const ALLOWED_KINDS = ['logo', 'banner'] as const
type AssetKind = (typeof ALLOWED_KINDS)[number]

const KIND_CONFIG: Record<AssetKind, { bucket: 'business-logos' | 'business-banners'; maxBytes: number }> = {
  logo: { bucket: 'business-logos', maxBytes: 5 * 1024 * 1024 }, // 5 MB
  banner: { bucket: 'business-banners', maxBytes: 8 * 1024 * 1024 }, // 8 MB
}

const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
])

/**
 * Upload d'un asset commercant (logo ou banniere).
 * Body : multipart/form-data { file: File, kind: 'logo' | 'banner' }
 *
 * Persist le path en DB (logo_url / banner_url) en URL publique pour
 * pouvoir l'afficher cote client (cartes loyalty, Apple Wallet) sans
 * signed URL — possible car les buckets sont public-read mais
 * owner-only write (RLS).
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) throw AppError.auth('Non autorisé')

  const formData = await request.formData()
  const file = formData.get('file')
  const kindRaw = formData.get('kind')

  if (!(file instanceof File)) throw AppError.validation('Fichier manquant.')
  if (typeof kindRaw !== 'string' || !ALLOWED_KINDS.includes(kindRaw as AssetKind)) {
    throw AppError.validation('Type d\'asset invalide.')
  }
  const kind = kindRaw as AssetKind

  if (!ALLOWED_MIME.has(file.type)) {
    throw AppError.validation('Format non supporté. Utilisez PNG, JPG, WebP ou SVG.')
  }

  const { bucket, maxBytes } = KIND_CONFIG[kind]
  if (file.size > maxBytes) {
    throw AppError.validation(`Fichier trop volumineux (max ${Math.round(maxBytes / 1024 / 1024)} MB).`)
  }

  // Determine extension
  const extByMime: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
  }
  const ext = extByMime[file.type] ?? 'png'
  const filename = `${kind}.${ext}`
  const path = `${user.id}/${filename}`

  const service = createServiceClient()

  // Cleanup old asset (any extension) avant l'upload pour eviter les orphelins
  const { data: existing } = await service.storage.from(bucket).list(user.id)
  if (existing && existing.length > 0) {
    const toRemove = existing
      .filter((entry) => entry.name.startsWith(`${kind}.`))
      .map((entry) => `${user.id}/${entry.name}`)
    if (toRemove.length > 0) {
      await service.storage.from(bucket).remove(toRemove)
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadError } = await service.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: '3600',
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    throw new AppError('Erreur lors de l\'upload.', 500)
  }

  // Bust le cache CDN en append d'un timestamp (URL change a chaque upload)
  const publicUrl = `${getBusinessAssetUrl(bucket, path)}?v=${Date.now()}`

  const column = kind === 'logo' ? 'logo_url' : 'banner_url'
  const { error: updateError } = await service
    .from('businesses')
    .update({ [column]: publicUrl })
    .eq('id', user.id)

  if (updateError) {
    console.error('DB update error:', updateError)
    throw new AppError('Upload reussi mais sauvegarde echouee.', 500)
  }

  return NextResponse.json({ success: true, url: publicUrl })
})

/**
 * DELETE : supprime l'asset (remet logo_url / banner_url a null).
 * Body JSON : { kind: 'logo' | 'banner' }
 */
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) throw AppError.auth('Non autorisé')

  const body = await request.json().catch(() => null)
  const kindRaw = body?.kind
  if (typeof kindRaw !== 'string' || !ALLOWED_KINDS.includes(kindRaw as AssetKind)) {
    throw AppError.validation('Type d\'asset invalide.')
  }
  const kind = kindRaw as AssetKind
  const { bucket } = KIND_CONFIG[kind]

  const service = createServiceClient()

  const { data: existing } = await service.storage.from(bucket).list(user.id)
  if (existing && existing.length > 0) {
    const toRemove = existing
      .filter((entry) => entry.name.startsWith(`${kind}.`))
      .map((entry) => `${user.id}/${entry.name}`)
    if (toRemove.length > 0) {
      await service.storage.from(bucket).remove(toRemove)
    }
  }

  const column = kind === 'logo' ? 'logo_url' : 'banner_url'
  await service
    .from('businesses')
    .update({ [column]: null })
    .eq('id', user.id)
    .throwOnError()

  return NextResponse.json({ success: true })
})
