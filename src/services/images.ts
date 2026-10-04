import { randomUUID } from 'node:crypto'
import { createUserSupabase } from '../lib/supabase.js'

export const MAX_IMAGE_BYTES = 300 * 1024
export const IMAGE_SIZE_LABEL = '300 KB'
export const PRODUCT_IMAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'product-images'

const extensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

export function acceptImageMime(mimetype: string) {
  return mimetype in extensions
}

export async function uploadProductImage(file: Express.Multer.File, accessToken: string) {
	const storageClient = createUserSupabase(accessToken)
	if (!storageClient) throw Object.assign(new Error('Supabase Storage is not configured.'), { status: 503 })
  const extension = extensions[file.mimetype]
  if (!extension) throw Object.assign(new Error('Use a JPG, PNG, WebP, or AVIF image.'), { status: 400 })

  const path = `products/${Date.now()}-${randomUUID()}.${extension}`
	const { error } = await storageClient.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file.buffer, {
    contentType: file.mimetype,
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) throw Object.assign(new Error(`Image upload failed: ${error.message}`), { status: 502 })
	return storageClient.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl
}
