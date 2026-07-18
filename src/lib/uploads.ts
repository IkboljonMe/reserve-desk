import 'server-only'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

// Uploaded images are compressed + converted to WebP and stored on disk, then
// served at /uploads/<scope>/<file>.webp on the same origin.
//
// Where they're written:
//   - Default: <project>/public/uploads — served automatically by Next. This
//     only works if the app process's working directory is the project root
//     (true for `next start` run from the project dir).
//   - If UPLOADS_DIR is set: that absolute directory is used instead. On the
//     VPS this should be a persistent path OUTSIDE the project (survives
//     redeploys) with nginx serving it, e.g.:
//         location /uploads/ { alias /var/www/bronit-uploads/; }
//     and UPLOADS_DIR=/var/www/bronit-uploads
const UPLOADS_ROOT = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(process.cwd(), 'public', 'uploads')
const URL_PREFIX = '/uploads'

// What the browser is allowed to send us. We always re-encode to WebP, so this
// is just a guard against non-image junk, not the output format.
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
const MAX_INPUT_BYTES = 12 * 1024 * 1024 // 12 MB before compression

// Per-scope max width (px). Images are downscaled to fit, never upscaled, then
// WebP-compressed. Scopes keep files tidy and let each kind pick a sane size.
export type UploadScope = 'products' | 'banners' | 'logos'
const SCOPE_MAX_WIDTH: Record<UploadScope, number> = {
  products: 1000,
  banners: 1600,
  logos: 400,
}
const WEBP_QUALITY = 80

export function isUploadScope(v: unknown): v is UploadScope {
  return v === 'products' || v === 'banners' || v === 'logos'
}

export class UploadError extends Error {}

// Validates, compresses, converts to WebP, and stores an uploaded image.
// Returns the public URL (e.g. "/uploads/products/ab12….webp"). Throws
// UploadError with a user-safe message on bad input.
export async function processAndStoreImage(file: File, scope: UploadScope): Promise<string> {
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new UploadError('No file provided')
  }
  if (!ALLOWED_MIME.has(file.type)) {
    throw new UploadError('Unsupported image type')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new UploadError('Image is too large (max 12 MB)')
  }

  const input = Buffer.from(await file.arrayBuffer())

  let output: Buffer
  try {
    output = await sharp(input)
      .rotate() // honour EXIF orientation before stripping metadata
      .resize({ width: SCOPE_MAX_WIDTH[scope], withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()
  } catch {
    throw new UploadError('Could not process image — is it a valid image file?')
  }

  const dir = path.join(UPLOADS_ROOT, scope)
  await mkdir(dir, { recursive: true })
  const filename = `${randomUUID()}.webp`
  await writeFile(path.join(dir, filename), output)

  return `${URL_PREFIX}/${scope}/${filename}`
}

// Best-effort delete of a previously-stored upload. Only touches files that
// resolve to inside UPLOADS_ROOT (guards against path traversal / deleting
// arbitrary files if a bogus URL is passed). External URLs are ignored.
export async function deleteUploadedImage(url: string): Promise<void> {
  if (!url || !url.startsWith(`${URL_PREFIX}/`)) return
  const rel = url.slice(URL_PREFIX.length + 1)
  const target = path.join(UPLOADS_ROOT, rel)
  const normalized = path.normalize(target)
  if (!normalized.startsWith(UPLOADS_ROOT + path.sep)) return
  try {
    await unlink(normalized)
  } catch {
    // Already gone / never existed — nothing to do.
  }
}
