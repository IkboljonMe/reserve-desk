export type UploadScope = 'products' | 'banners' | 'logos'

// Uploads a single image file to the server, which compresses it to WebP and
// stores it on the VPS. Returns the public URL to persist on the record.
export async function uploadImage(file: File, scope: UploadScope): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  form.append('scope', scope)
  const res = await fetch('/api/uploads', { method: 'POST', body: form })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // A JSON `error` means the app answered (validation etc.). No JSON body on a
    // non-OK response means something between the browser and the app rejected
    // it — most often nginx returning 413 (body over client_max_body_size).
    if (data.error) throw new Error(data.error)
    if (res.status === 413) throw new Error('Image too large for the server to accept (proxy limit)')
    throw new Error(`Upload failed (HTTP ${res.status})`)
  }
  return data.url as string
}
