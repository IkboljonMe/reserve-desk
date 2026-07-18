export type UploadScope = 'products' | 'banners' | 'logos'

// Uploads a single image file to the server, which compresses it to WebP and
// stores it on the VPS. Returns the public URL to persist on the record.
export async function uploadImage(file: File, scope: UploadScope): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  form.append('scope', scope)
  const res = await fetch('/api/uploads', { method: 'POST', body: form })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data.url as string
}
