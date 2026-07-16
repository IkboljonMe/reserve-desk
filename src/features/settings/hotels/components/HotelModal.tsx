'use client'

import { X } from 'lucide-react'
import { useTranslation } from '@/i18n'
import Spinner from '@/components/ui/Spinner'
import type { HotelsRoomsPageState } from '../useHotelsRoomsPage'
import Button from '@/components/ui/Button'

export function HotelModal({ s }: { s: HotelsRoomsPageState }) {
  const { t } = useTranslation()
  const {
    hotelOpen, setHotelOpen, editHotelId, handleSubmitHotel, hotelForm, setHotelForm,
    onHotelNameChange, onShortNameChange, shortNameError, onSlugChange, slugError,
    roomCategoryInput, setRoomCategoryInput, savingHotel,
  } = s
  if (!hotelOpen) return null

  return (
    <div className="modal-overlay" onClick={() => setHotelOpen(false)}>
      <div className="modal max-w-[440px]" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editHotelId ? t('editHotel') : t('addHotel')}</h2>
          <Button variant="ghost" icon onClick={() => setHotelOpen(false)} aria-label={t('close')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </Button>
        </div>
        <form onSubmit={handleSubmitHotel}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{t('fullHotelName')} *</label>
              <input
                className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[var(--gray-800)] hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
                required
                value={hotelForm.name}
                onChange={e => onHotelNameChange(e.target.value)}
                placeholder={t('hotelNamePlaceholder')}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{t('shortCode')} *</label>
              <input
                className={`w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border text-[var(--gray-800)] uppercase font-semibold tracking-wider hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] ${
                  shortNameError ? 'border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.14)]' : 'border-[var(--gray-200,#e5e7eb)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]'
                }`}
                required
                value={hotelForm.shortName}
                onChange={e => onShortNameChange(e.target.value)}
                placeholder={t('shortCodePlaceholder')}
                maxLength={5}
                aria-invalid={!!shortNameError}
              />
              {shortNameError ? (
                <small className="mt-1 text-xs text-[var(--danger,#ef4444)] block">{shortNameError}</small>
              ) : (
                <small className="mt-1 text-xs text-[var(--gray-400)] block">
                  {t('shortCodeHint', { code: hotelForm.shortName || 'FG' })}
                </small>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{t('hotelSlug')}</label>
              <input
                className={`w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border text-[var(--gray-800)] hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] ${
                  slugError ? 'border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.14)]' : 'border-[var(--gray-200,#e5e7eb)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]'
                }`}
                value={hotelForm.slug}
                onChange={e => onSlugChange(e.target.value)}
                placeholder={t('hotelSlugPlaceholder')}
                aria-invalid={!!slugError}
              />
              {slugError ? (
                <small className="mt-1 text-xs text-[var(--danger,#ef4444)] block">{slugError}</small>
              ) : (
                <small className="mt-1 text-xs text-[var(--gray-400)] block">
                  {t('hotelSlugHint', { slug: hotelForm.slug || '…' })}
                </small>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{t('location')}</label>
              <input
                className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[var(--gray-800)] hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
                value={hotelForm.location}
                onChange={e => setHotelForm(f => ({ ...f, location: e.target.value }))}
                placeholder={t('locationPlaceholder')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{t('roomCategories')}</label>
              {hotelForm.roomTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {hotelForm.roomTypes.map((rt, i) => (
                    <span key={i} className="bg-[var(--brand-100,#eef2ff)] text-[var(--brand-700,#4338ca)] px-2.5 py-0.5 rounded-full font-semibold text-[0.8125rem] inline-flex items-center gap-1.5">
                      {rt}
                      <button type="button" onClick={() => setHotelForm(f => ({ ...f, roomTypes: f.roomTypes.filter((_, idx) => idx !== i) }))} className="bg-transparent border-0 text-[var(--danger,#ef4444)] cursor-pointer p-0 inline-flex items-center hover:opacity-80">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[var(--gray-800)] hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
                value={roomCategoryInput}
                onChange={e => setRoomCategoryInput(e.target.value)}
                placeholder={t('categoryInputPlaceholder')}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault() // prevent submitting the whole hotel form
                    const val = e.currentTarget.value.trim()
                    if (val && !hotelForm.roomTypes.includes(val)) {
                      setHotelForm(f => ({ ...f, roomTypes: [...f.roomTypes, val] }))
                      setRoomCategoryInput('')
                    }
                  }
                }}
              />
              <small className="mt-1 text-xs text-[var(--gray-400)] block">
                {t('roomCategoriesHint')}
              </small>
            </div>
          </div>
          <div className="h-px bg-surface-border my-4" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setHotelOpen(false)}>{t('cancel')}</Button>
            <Button type="submit" disabled={savingHotel || !!shortNameError || !!slugError}>
              {savingHotel ? <Spinner size={18} dark={false} /> : null}
              {savingHotel ? (editHotelId ? t('saving') : t('adding')) : (editHotelId ? t('save') : t('addHotel'))}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
