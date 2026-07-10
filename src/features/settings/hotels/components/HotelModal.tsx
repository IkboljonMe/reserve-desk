'use client'

import { X } from 'lucide-react'
import { useTranslation } from '@/i18n'
import type { HotelsRoomsPageState } from '../useHotelsRoomsPage'

export function HotelModal({ s }: { s: HotelsRoomsPageState }) {
  const { t } = useTranslation()
  const {
    hotelOpen, setHotelOpen, editHotelId, handleSubmitHotel, hotelForm, setHotelForm,
    onHotelNameChange, onShortNameChange, shortNameError, roomCategoryInput, setRoomCategoryInput, savingHotel,
  } = s
  if (!hotelOpen) return null

  return (
    <div className="modal-overlay" onClick={() => setHotelOpen(false)}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editHotelId ? t('editHotel') : t('addHotel')}</h2>
          <button className="btn btn-ghost btn-icon" onClick={() => setHotelOpen(false)} aria-label={t('close')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmitHotel}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div className="form-group">
              <label className="form-label">{t('fullHotelName')} *</label>
              <input
                className="form-input"
                required
                value={hotelForm.name}
                onChange={e => onHotelNameChange(e.target.value)}
                placeholder={t('hotelNamePlaceholder')}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('shortCode')} *</label>
              <input
                className="form-input"
                required
                value={hotelForm.shortName}
                onChange={e => onShortNameChange(e.target.value)}
                placeholder={t('shortCodePlaceholder')}
                maxLength={5}
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                  ...(shortNameError ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' } : {}),
                }}
                aria-invalid={!!shortNameError}
              />
              {shortNameError ? (
                <small className="form-error" style={{ display: 'block', marginTop: 4 }}>{shortNameError}</small>
              ) : (
                <small style={{ color: 'var(--gray-400)', fontSize: '0.72rem', display: 'block', marginTop: 4 }}>
                  {t('shortCodeHint', { code: hotelForm.shortName || 'FG' })}
                </small>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">{t('location')}</label>
              <input
                className="form-input"
                value={hotelForm.location}
                onChange={e => setHotelForm(f => ({ ...f, location: e.target.value }))}
                placeholder={t('locationPlaceholder')}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('roomCategories')}</label>
              {hotelForm.roomTypes.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {hotelForm.roomTypes.map((rt, i) => (
                    <span key={i} style={{ background: 'var(--brand-100)', color: 'var(--brand-700)', padding: '2px 8px', borderRadius: 12, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {rt}
                      <button type="button" onClick={() => setHotelForm(f => ({ ...f, roomTypes: f.roomTypes.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                className="form-input"
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
              <small style={{ color: 'var(--gray-400)', fontSize: '0.72rem', display: 'block', marginTop: 4 }}>
                {t('roomCategoriesHint')}
              </small>
            </div>
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setHotelOpen(false)}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={savingHotel || !!shortNameError}>
              {savingHotel ? <span className="spinner" /> : null}
              {savingHotel ? (editHotelId ? t('saving') : t('adding')) : (editHotelId ? t('save') : t('addHotel'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
