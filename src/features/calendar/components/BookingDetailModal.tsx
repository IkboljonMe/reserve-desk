'use client'

import { format, parseISO } from 'date-fns'
import { X, Check, Clock, MapPin, Phone, User, Trash2, CalendarDays, Wallet } from 'lucide-react'
import { getServiceIcon } from '@/lib/serviceIcons'
import { bookingState, money } from '@/lib/bookingHelpers'
import { DetailRow } from './DetailRow'
import type { CalendarPageState } from '../useCalendarPage'

export function BookingDetailModal({ s }: { s: CalendarPageState }) {
  const { selectedBooking, setSelectedBooking, deleteConfirm, setDeleteConfirm, setPayConfirm, markFinished, handleDeleteBooking } = s
  if (!selectedBooking) return null

  const close = () => { setSelectedBooking(null); setDeleteConfirm(null) }

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h2>Booking Details</h2>
          <button className="btn btn-ghost btn-icon" onClick={close} aria-label="Close"><X size={18} /></button>
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
                  {st.label}
                </span>
              )
            })()}
          </div>

          <DetailRow icon={<User size={15} />} label="Guest" value={selectedBooking.customerName} />
          {selectedBooking.roomNumber && <DetailRow icon={<MapPin size={15} />} label="Room" value={`🏨 ${selectedBooking.roomNumber}`} accent />}
          {selectedBooking.customerPhone && <DetailRow icon={<Phone size={15} />} label="Phone" value={selectedBooking.customerPhone} />}
          <DetailRow icon={<CalendarDays size={15} />} label="Date" value={format(parseISO(selectedBooking.date), 'EEEE, MMM d, yyyy')} />
          <DetailRow icon={<Clock size={15} />} label="Time" value={`${selectedBooking.startTime} – ${selectedBooking.endTime}`} />
          {selectedBooking.totalPrice > 0 && (
            <DetailRow icon={<span style={{ fontWeight: 700, fontSize: 11 }}>UZS</span>} label="Price" value={`${money(selectedBooking.totalPrice)} UZS`} success />
          )}
          <DetailRow
            icon={<Wallet size={15} />}
            label="Payment"
            value={selectedBooking.totalPrice === 0 ? 'Free — no charge' : selectedBooking.paid ? 'Paid' : 'Unpaid'}
            accent={!selectedBooking.paid && selectedBooking.totalPrice > 0}
            success={selectedBooking.paid}
          />
          {selectedBooking.notes && <DetailRow icon={<span style={{ fontSize: 14 }}>📝</span>} label="Notes" value={selectedBooking.notes} />}
        </div>

        <div className="divider" />

        {/* Lifecycle actions */}
        {selectedBooking.finished ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0.6rem', marginBottom: '0.85rem', borderRadius: 10, background: '#10b98114', color: '#059669', fontWeight: 700, fontSize: '0.85rem' }}>
            <Check size={16} /> Completed
          </div>
        ) : bookingState(selectedBooking).key === 'unpaid' ? (
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: '0.85rem' }} onClick={() => setPayConfirm(selectedBooking)}>
            <Wallet size={15} /> Mark as Paid
          </button>
        ) : (
          <button
            className="btn"
            style={{ width: '100%', marginBottom: '0.85rem', background: '#10b981', color: '#fff', border: 'none' }}
            onClick={() => markFinished(selectedBooking)}
          >
            <Check size={16} strokeWidth={2.5} /> Mark as Finished
          </button>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {deleteConfirm === selectedBooking._id ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--danger)' }}>Delete this booking?</span>
              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBooking(selectedBooking._id)}>Delete</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>Cancel</button>
            </div>
          ) : (
            <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(selectedBooking._id)}>
              <Trash2 size={13} /> Delete
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={close}>Close</button>
        </div>
      </div>
    </div>
  )
}
