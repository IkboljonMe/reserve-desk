'use client'

import { BedDouble, Check, Search } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { getServiceIcon } from '@/lib/serviceIcons'
import { chipStyle } from '../styles'
import { formatDuration, formatUZS, slotEnd } from '../utils'
import { BackButton } from './BackButton'
import { ContextBar } from './ContextBar'
import type { BookingWizard } from '../useBookingWizard'

export function ConfirmStep({ w }: { w: BookingWizard }) {
  const { t, lang } = useTranslation()
  const {
    selectedService, activePlan, selectedSlot, bookingType, categoryMeta,
    clientSearch, setClientSearch, clientResults, selectedClientId, setSelectedClientId, pickClient,
    categoryRooms, selectedRoomId, pickRoom, roomLabel,
    customerName, setCustomerName, customerPhone, setCustomerPhone,
    roomNumber, setRoomNumber, notes, setNotes, paid, setPaid,
    date, loading, router,
  } = w
  if (!selectedService || !activePlan || !selectedSlot) return null

  return (
    <div className="card" style={{ animation: 'slideInRight 0.3s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
        <BackButton to={4} onBack={w.setStep} />
        <h2 style={{ margin: 0 }}>{t('confirmBooking')}</h2>
      </div>
      <ContextBar w={w} />

      {/* CLIENT: search saved clients in group, or type a new guest */}
      {bookingType === 'client' && (
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label">{t('guestsIn', { group: categoryMeta?.label ?? '' })}</label>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 34 }}
              placeholder={t('searchThisGroup')}
              value={clientSearch}
              onChange={e => setClientSearch(e.target.value)}
            />
          </div>
          {clientResults.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
              {clientResults.map(c => {
                const active = selectedClientId === c._id
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => pickClient(c)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                      padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                      border: `1.5px solid ${active ? 'var(--brand-500)' : 'var(--gray-200)'}`,
                      background: active ? 'var(--brand-50)' : '#fff',
                    }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: 'var(--brand-100)', color: 'var(--brand-600)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                    }}>{c.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: '0.875rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                        {c.roomNumber ? `🏨 ${c.roomNumber}` : ''}{c.phone ? `${c.roomNumber ? ' · ' : ''}${c.phone}` : ''}
                      </div>
                    </div>
                    {active && <Check size={16} style={{ marginLeft: 'auto', color: 'var(--brand-500)' }} />}
                  </button>
                )
              })}
            </div>
          ) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', margin: 0 }}>
              {clientSearch ? t('noSavedGuestsMatch') : t('noSavedGuests')}
            </p>
          )}
        </div>
      )}

      {/* ROOM: pick a room of the chosen category */}
      {bookingType === 'room' && (
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label">{t('room')} ({categoryMeta?.label})</label>
          {categoryRooms.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', margin: 0 }}>
              {t('noRoomsCategory')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {categoryRooms.map(r => {
                const active = selectedRoomId === r._id
                return (
                  <button
                    key={r._id}
                    type="button"
                    onClick={() => pickRoom(r)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: 8,
                      border: `1.5px solid ${active ? 'var(--brand-500)' : 'var(--gray-200)'}`,
                      background: active ? 'var(--brand-50)' : '#fff',
                      color: active ? 'var(--brand-700)' : 'var(--gray-700)',
                      fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
                    }}
                  >
                    <BedDouble size={14} /> {roomLabel(r)}
                    <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontWeight: 400 }}>· {t('floorShort')} {r.floor}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Guest name + phone (all types) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">{t('guestName')} *</label>
          <input
            type="text" className="form-input" placeholder={t('fullNamePlaceholder')}
            value={customerName}
            onChange={e => { setCustomerName(e.target.value); if (selectedClientId) setSelectedClientId(null) }}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t('phone')}</label>
          <input
            type="tel" className="form-input" placeholder="+998 90 123 4567"
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
          />
        </div>
      </div>

      {/* Room number field for client/custom types (room type already set above) */}
      {bookingType !== 'room' && (
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label">{t('roomNumberField')}</label>
          <input
            className="form-input" placeholder={t('roomNumberPlaceholder')}
            value={roomNumber}
            onChange={e => setRoomNumber(e.target.value)}
          />
        </div>
      )}

      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">{t('notesOptional')}</label>
        <textarea
          className="form-textarea" placeholder={t('specialRequirements')}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">{t('payment')}</label>
        {activePlan.price === 0 ? (
          <div style={{ ...chipStyle('#3b82f618', '#2563eb'), padding: '8px 12px' }}>{t('freeNoPayment')}</div>
        ) : (
          <select
            className="form-select" style={{ maxWidth: 200 }}
            value={paid ? 'paid' : 'unpaid'}
            onChange={e => setPaid(e.target.value === 'paid')}
          >
            <option value="unpaid">🔴 {t('unpaid')}</option>
            <option value="paid">✓ {t('paid')}</option>
          </select>
        )}
      </div>

      {/* Order summary */}
      <div style={{
        background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 10,
        padding: '1rem', marginBottom: '1.25rem', fontSize: '0.875rem',
        display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.45rem 1rem', color: 'var(--gray-600)',
      }}>
        <strong style={{ color: 'var(--gray-800)' }}>{t('service')}</strong>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: selectedService.color, display: 'inline-flex' }}>{getServiceIcon(selectedService.name)}</span>
          {selectedService.name}
        </span>

        <strong style={{ color: 'var(--gray-800)' }}>{t('toWhom')}</strong>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {customerName || <span style={{ color: 'var(--gray-300)' }}>—</span>}
          {categoryMeta && (
            <span style={chipStyle(`${categoryMeta.color}18`, categoryMeta.color)}>{categoryMeta.label}</span>
          )}
          {bookingType === 'room' && roomNumber && (
            <span style={chipStyle('var(--gray-100)', 'var(--gray-600)')}>🏨 {roomNumber}</span>
          )}
          {bookingType === 'custom' && <span style={chipStyle('#f59e0b18', '#b45309')}>{t('typeCustom')}</span>}
        </span>

        <strong style={{ color: 'var(--gray-800)' }}>{t('whenLabel')}</strong>
        <span>{date} · {selectedSlot} – {slotEnd(selectedSlot, activePlan.duration)} ({formatDuration(activePlan.duration)})</span>

        <strong style={{ color: 'var(--gray-800)' }}>{t('howMuch')}</strong>
        <span style={{ color: 'var(--brand-700)', fontWeight: 700 }}>
          {activePlan.price === 0 ? t('isFree') : `${formatUZS(activePlan.price)} ${t('sum')}`}
        </span>

        <strong style={{ color: 'var(--gray-800)' }}>{t('payment')}</strong>
        <span>{activePlan.price === 0 ? t('free') : paid ? `✓ ${t('paid')}` : `🔴 ${t('unpaid')}`}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button type="button" className="btn btn-secondary" onClick={() => router.push(`/${lang}/calendar`)}>{t('cancel')}</button>
        <button
          id="confirm-booking-btn"
          type="submit"
          className="btn btn-primary"
          disabled={loading || !customerName.trim()}
        >
          {loading ? <span className="spinner" /> : null}
          {loading ? t('creating') : t('confirmBooking')}
        </button>
      </div>
    </div>
  )
}
