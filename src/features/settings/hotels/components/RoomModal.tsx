'use client'

import { Building2 } from 'lucide-react'
import { useTranslation } from '@/i18n'
import Select from '@/components/Select'
import Spinner from '@/components/ui/Spinner'
import { displayCode } from '../utils'
import type { HotelsRoomsPageState } from '../useHotelsRoomsPage'
import Button from '@/components/ui/Button'

export function RoomModal({ s }: { s: HotelsRoomsPageState }) {
  const { t } = useTranslation()
  const {
    roomOpen, setRoomOpen, editRoomId, handleSubmitRoom, roomForm, setRoomForm,
    hotels, hotelById, roomHotel, roomShort, savingRoom,
  } = s
  if (!roomOpen) return null

  return (
    <div className="modal-overlay" onClick={() => setRoomOpen(false)}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editRoomId ? t('editRoom') : t('addRoom')}</h2>
          <Button variant="ghost" icon onClick={() => setRoomOpen(false)} aria-label={t('close')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </Button>
        </div>
        <form onSubmit={handleSubmitRoom}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{t('hotel')} *</label>
              <Select
                ariaLabel={t('hotel')}
                placeholder={t('selectHotel')}
                icon={<Building2 size={16} />}
                value={roomForm.hotelId}
                onChange={v => {
                  const h = hotelById.get(v)
                  setRoomForm(f => ({ ...f, hotelId: v, type: h?.roomTypes?.[0] || '' }))
                }}
                options={hotels.map(h => ({ value: h._id, label: `${displayCode(h)} · ${h.name}` }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('floor')} *</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  required
                  value={roomForm.floor}
                  onChange={e => setRoomForm(f => ({ ...f, floor: parseInt(e.target.value) || 1 }))}
                  placeholder="2"
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('roomNumberField')} *</label>
                <input
                  className="form-input"
                  required
                  value={roomForm.number}
                  onChange={e => setRoomForm(f => ({ ...f, number: e.target.value }))}
                  placeholder="202"
                />
              </div>
            </div>

            {roomHotel && roomHotel.roomTypes && roomHotel.roomTypes.length > 0 && (
              <div className="form-group">
                <label className="form-label">{t('category')}</label>
                <Select
                  ariaLabel={t('roomCategoryAria')}
                  placeholder={t('selectCategory')}
                  value={roomForm.type}
                  onChange={v => setRoomForm(f => ({ ...f, type: v }))}
                  options={roomHotel.roomTypes.map(rt => ({ value: rt, label: rt }))}
                />
              </div>
            )}

            {/* Live preview of the generated room name */}
            <div style={{
              background: 'var(--brand-50)',
              border: '1px solid var(--brand-100)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: '0.8125rem',
              color: 'var(--brand-700)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {t('roomNameLabel')}&nbsp;
              <strong style={{ fontSize: '0.9375rem', fontVariantNumeric: 'tabular-nums' }}>
                {roomShort}-{roomForm.number || '###'}
              </strong>
            </div>
          </div>
          <div className="h-px bg-surface-border my-4" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button type="button" variant="secondary" onClick={() => setRoomOpen(false)}>{t('cancel')}</Button>
            <Button type="submit" disabled={savingRoom}>
              {savingRoom ? <Spinner size={18} dark={false} /> : null}
              {savingRoom ? t('saving') : editRoomId ? t('save') : t('addRoom')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
