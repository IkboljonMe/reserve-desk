'use client'

import { format, parseISO } from 'date-fns'
import { X, Check, Clock, MapPin, Phone, User, Trash2, CalendarDays, Wallet, FileText, Pencil, UtensilsCrossed } from 'lucide-react'
import { getServiceIcon } from '@/lib/serviceIcons'
import { bookingState, money, amountCollected, isPartiallyPaid } from '@/lib/bookingHelpers'
import { useTranslation } from '@/i18n'
import { DetailRow } from './DetailRow'
import type { CalendarPageState } from '../useCalendarPage'

export function BookingDetailModal({ s }: { s: CalendarPageState }) {
  const { t } = useTranslation()
  const { selectedBooking, setSelectedBooking, deleteConfirm, setDeleteConfirm, setPayConfirm, setEditBooking, markFinished, handleDeleteBooking } = s
  if (!selectedBooking) return null

  const close = () => { setSelectedBooking(null); setDeleteConfirm(null) }

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h2>{t('bookingDetails')}</h2>
          <button className="btn btn-ghost btn-icon" onClick={close} aria-label={t('close')}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem',
            borderRadius: 10, background: `${selectedBooking.serviceId?.color || '#6366f1'}12`,
            border: `1px solid ${selectedBooking.serviceId?.color || '#6366f1'}33`,
          }}>
            <span style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: `${selectedBooking.serviceId?.color || '#6366f1'}22`,
              color: selectedBooking.serviceId?.color || '#6366f1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{getServiceIcon(selectedBooking.serviceId?.name || '')}</span>
            <strong style={{ color: 'var(--gray-800)', fontSize: '0.95rem' }}>{selectedBooking.serviceId?.name}</strong>
            {(() => {
              const st = bookingState(selectedBooking)
              return (
                <span className={`badge ${st.badge}`} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {st.key === 'finished' && <Check size={12} />}
                  {t(st.key)}
                </span>
              )
            })()}
          </div>

          <DetailRow icon={<User size={15} />} label={t('guest')} value={selectedBooking.customerName} />
          {selectedBooking.roomNumber && <DetailRow icon={<MapPin size={15} />} label={t('room')} value={selectedBooking.roomNumber} accent />}
          {selectedBooking.customerPhone && <DetailRow icon={<Phone size={15} />} label={t('phone')} value={selectedBooking.customerPhone} />}
          <DetailRow icon={<CalendarDays size={15} />} label={t('date')} value={format(parseISO(selectedBooking.date), 'EEEE, MMM d, yyyy')} />
          <DetailRow icon={<Clock size={15} />} label={t('time')} value={`${selectedBooking.startTime} – ${selectedBooking.endTime}`} />
          {selectedBooking.totalPrice > 0 && (
            <DetailRow icon={<span style={{ fontWeight: 700, fontSize: 11 }}>{t('sum')}</span>} label={t('price')} value={`${money(selectedBooking.totalPrice)} ${t('sum')}`} success />
          )}
          <DetailRow
            icon={<Wallet size={15} />}
            label={t('payment')}
            value={
              selectedBooking.totalPrice === 0
                ? t('freeNoCharge')
                : selectedBooking.paid
                  ? t('paid')
                  : isPartiallyPaid(selectedBooking)
                    ? `${money(amountCollected(selectedBooking))} / ${money(selectedBooking.totalPrice)} ${t('sum')}`
                    : t('unpaid')
            }
            accent={!selectedBooking.paid && selectedBooking.totalPrice > 0}
            success={selectedBooking.paid}
          />
          {selectedBooking.notes && <DetailRow icon={<FileText size={15} />} label={t('notes')} value={selectedBooking.notes} />}
          {selectedBooking.menu && (
            <DetailRow
              icon={<UtensilsCrossed size={15} />}
              label={t('menu')}
              value={selectedBooking.menu + (selectedBooking.menuReadyTime ? ` · ${t('menuReadyTime')} ${selectedBooking.menuReadyTime}` : '')}
            />
          )}
        </div>

        <div className="divider" />

        {/* Lifecycle actions */}
        {selectedBooking.finished ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0.6rem', marginBottom: '0.85rem', borderRadius: 10, background: '#10b98114', color: '#059669', fontWeight: 700, fontSize: '0.85rem' }}>
            <Check size={16} /> {t('completed')}
          </div>
        ) : (bookingState(selectedBooking).key === 'unpaid' || bookingState(selectedBooking).key === 'partial') ? (
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: '0.85rem' }} onClick={() => setPayConfirm(selectedBooking)}>
            <Wallet size={15} /> {isPartiallyPaid(selectedBooking) ? t('collectBalance') : t('markAsPaid')}
          </button>
        ) : (
          <button
            className="btn"
            style={{ width: '100%', marginBottom: '0.85rem', background: '#10b981', color: '#fff', border: 'none' }}
            onClick={() => markFinished(selectedBooking)}
          >
            <Check size={16} strokeWidth={2.5} /> {t('markAsFinished')}
          </button>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {deleteConfirm === selectedBooking._id ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--danger)' }}>{t('deleteThisBooking')}</span>
              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBooking(selectedBooking._id)}>{t('delete')}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>{t('cancel')}</button>
            </div>
          ) : (
            <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(selectedBooking._id)}>
              <Trash2 size={13} /> {t('delete')}
            </button>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            {!selectedBooking.finished && (
              <button className="btn btn-secondary btn-sm" onClick={() => { setEditBooking(selectedBooking); setSelectedBooking(null) }}>
                <Pencil size={13} /> {t('edit')}
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={close}>{t('close')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
