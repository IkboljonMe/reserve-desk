'use client'

import { Check, Wallet } from 'lucide-react'
import { money } from '@/lib/bookingHelpers'
import type { CalendarPageState } from '../useCalendarPage'

export function PayConfirmModal({ s }: { s: CalendarPageState }) {
  const { payConfirm, setPayConfirm, markPaid } = s
  if (!payConfirm) return null

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={() => setPayConfirm(null)}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 384 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.75rem' }}>
          <span style={{ width: 52, height: 52, borderRadius: '50%', background: '#10b98118', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={24} />
          </span>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Confirm payment</h2>
          <p style={{ margin: 0, color: 'var(--gray-600)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Did you receive <strong style={{ color: 'var(--gray-900)' }}>{money(payConfirm.totalPrice)} UZS</strong>
            {' '}from <strong style={{ color: 'var(--gray-900)' }}>{payConfirm.customerName}</strong>?
          </p>
        </div>
        <div className="divider" />
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPayConfirm(null)}>Back</button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={async () => { await markPaid(payConfirm); setPayConfirm(null) }}
          >
            <Check size={15} strokeWidth={2.5} /> Yes, received
          </button>
        </div>
      </div>
    </div>
  )
}
