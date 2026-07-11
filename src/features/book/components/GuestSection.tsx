'use client'

import { BedDouble, Check, Search, UserPlus, X } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { useIsMobile } from '@/hooks/useIsMobile'
import { AddClientModal } from './AddClientModal'
import type { BookingWizard } from '../useBookingWizard'

// Guest / room details, shown once the plan (type + category + duration/price) is ready.
export function GuestSection({ w }: { w: BookingWizard }) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const {
    bookingType, planReady, categoryMeta,
    clientSearch, setClientSearch, clientResults, selectedClientId, pickClient, clearClient,
    categoryRooms, selectedRoomId, pickRoom, roomLabel,
    customerName, setCustomerName, customerPhone, setCustomerPhone,
    roomNumber, setRoomNumber, notes, setNotes,
    menu, setMenu, menuReadyTime, setMenuReadyTime,
    openAddClientModal,
  } = w
  if (!planReady) return null

  return (
    <div>
      {/* CLIENT: search saved clients in group, or add a new one */}
      {bookingType === 'client' && (
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label">{t('guestsIn', { group: categoryMeta?.label ?? '' })}</label>

          {selectedClientId ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8,
              border: '1.5px solid var(--brand-500)', background: 'var(--brand-50)',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--brand-100)', color: 'var(--brand-600)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
              }}>{customerName.charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: '0.875rem' }}>{customerName}</div>
                {customerPhone && <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{customerPhone}</div>}
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearClient} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <X size={14} /> {t('changeGuest')}
              </button>
            </div>
          ) : (
            <>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 168, overflowY: 'auto' }}>
                  {clientResults.map(c => (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => pickClient(c)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                        padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                        border: '1.5px solid var(--gray-200)', background: '#fff', flexShrink: 0,
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
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          {c.roomNumber && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><BedDouble size={11} />{c.roomNumber}</span>}
                          {c.phone && <span>{c.roomNumber ? ' · ' : ''}{c.phone}</span>}
                        </div>
                      </div>
                      <Check size={16} style={{ marginLeft: 'auto', color: 'var(--gray-200)' }} />
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', margin: '0 0 10px' }}>
                  {clientSearch ? t('noClientFoundName', { name: clientSearch.trim() }) : t('noSavedGuests')}
                </p>
              )}
              <button type="button" className="btn btn-secondary btn-sm" onClick={openAddClientModal} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: clientResults.length > 0 ? 8 : 0 }}>
                <UserPlus size={14} /> {t('addClient')}
              </button>
              <AddClientModal w={w} />
            </>
          )}
        </div>
      )}

      {/* ROOM: pick a room of the chosen category */}
      {bookingType === 'room' && (
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label">{t('pickARoom')} ({categoryMeta?.label})</label>
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

      {/* Optional guest details — required for "client", optional for "room" */}
      {bookingType === 'room' && (
        <label className="form-label" style={{ display: 'block', marginBottom: 4 }}>{t('guestDetailsOptional')}</label>
      )}
      {bookingType !== 'client' && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label">{t('guestName')}</label>
            <input
              type="text" className="form-input" placeholder={t('fullNamePlaceholder')}
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
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
      )}

      {/* Room number field for the client type (room type already picks a specific room above) */}
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

      {/* Optional food/order request — e.g. for a SPA & Pool event. */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 140px', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">{t('menuOptional')}</label>
          <textarea
            className="form-textarea" placeholder={t('menuPlaceholder')}
            value={menu}
            onChange={e => setMenu(e.target.value)}
            style={{ minHeight: 64 }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t('menuReadyTime')}</label>
          <input
            type="time" className="form-input"
            value={menuReadyTime}
            onChange={e => setMenuReadyTime(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
