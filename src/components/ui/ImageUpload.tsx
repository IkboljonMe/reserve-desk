'use client'

import { useRef, useState } from 'react'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { useToast } from '@/components/ToastProvider'
import { uploadImage, type UploadScope } from '@/lib/api/uploads'

// Reusable image picker: user selects a file → it's uploaded, compressed to
// WebP on the server, and `onChange` gets the stored URL. Shows a live preview
// and a remove button. `value` is the current stored URL ('' when none).
export function ImageUpload({
  value,
  onChange,
  scope,
  variant = 'wide',
  label,
}: {
  value: string
  onChange: (url: string) => void
  scope: UploadScope
  // 'wide' → banner-style rectangle; 'avatar' → small round (logos).
  variant?: 'wide' | 'avatar'
  label?: string
}) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file, scope)
      onChange(url)
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('uploadFailed'), 'error')
    } finally {
      setUploading(false)
    }
  }

  const isAvatar = variant === 'avatar'
  const frameClass = isAvatar
    ? 'w-20 h-20 rounded-full'
    : 'w-full h-32 rounded-lg'

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{label}</label>
      )}
      <div className={`relative ${isAvatar ? 'w-20' : 'w-full'}`}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`${frameClass} overflow-hidden border-1.5 border-dashed border-[var(--gray-300)] bg-[var(--gray-50)] flex items-center justify-center text-[var(--gray-400)] cursor-pointer transition-colors hover:border-[var(--brand-500)] hover:text-[var(--brand-500)] disabled:cursor-not-allowed`}
          aria-label={t('uploadImage')}
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element -- user-uploaded WebP served from /uploads; next/image needs configured sizes we don't want here
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <ImagePlus size={isAvatar ? 18 : 22} />
              {!isAvatar && <span className="text-[0.75rem] font-medium">{t('uploadImage')}</span>}
            </div>
          )}
        </button>
        {value && !uploading && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--danger)] text-white flex items-center justify-center shadow cursor-pointer"
            aria-label={t('removeImage')}
          >
            <X size={13} />
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
    </div>
  )
}
