import { NextRequest } from 'next/server'
import { requireDashboard } from '@/lib/session'
import { processAndStoreImage, isUploadScope, UploadError } from '@/lib/uploads'

// sharp + fs require the Node.js runtime (not Edge).
export const runtime = 'nodejs'

// POST /api/uploads — accepts a multipart form with `file` and `scope`
// (products | banners | logos). Any authenticated dashboard user (owner or
// admin) may upload; the image is compressed to WebP and stored on the VPS.
// Returns { url } — the public path to reference from a menu/hub record.
export async function POST(req: NextRequest) {
  const session = await requireDashboard()
  if (session instanceof Response) return session

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return Response.json({ error: 'Expected multipart form data' }, { status: 400 })
  }

  const file = form.get('file')
  const scope = form.get('scope')

  if (!(file instanceof File)) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }
  if (!isUploadScope(scope)) {
    return Response.json({ error: 'Invalid upload scope' }, { status: 400 })
  }

  try {
    const url = await processAndStoreImage(file, scope)
    return Response.json({ url }, { status: 201 })
  } catch (err) {
    if (err instanceof UploadError) {
      return Response.json({ error: err.message }, { status: 400 })
    }
    console.error('Image upload failed', err)
    return Response.json({ error: 'Failed to process image' }, { status: 500 })
  }
}
