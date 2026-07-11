'use client'

import { useState } from 'react'
import { Check, Wallet } from 'lucide-react'
import { money, amountCollected, amountDue } from '@/lib/bookingHelpers'
import { useTranslation } from '@/i18n'
import type { CalendarPageState } from '../useCalendarPage'

export function PayConfirmModal({ s }: { s: CalendarPageState }) {
  const { t } = useTranslation()
  const { payConfirm, setPayConfirm, recordPayment } = s

  const total = payConfirm?.totalPrice || 0
  const collected = payConfirm ? amountCollected(payConfirm) : 0
  const due = payConfirm ? amountDue(payConfirm) : 0
  // "Amount received now" — defaults to the full remaining balance.
  const [received, setReceived] = useState('')
  if (!payConfirm) return null

  const receivedNum = received === '' ? due : Math.max(0, Math.min(due, Number(received) || 0))
  const newTotal = collected + receivedNum
  const settlesFully = total > 0 && newTotal >= total

  const close = () => { setPayConfirm(null); setReceived('') }

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={close}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 384 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.75rem' }}>
          <span style={{ width: 52, height: 52, borderRadius: '50%', background: '#10b98118', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={24} />
          </span>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{t('confirmPayment')}</h2>
          <p style={{ margin: 0, color: 'var(--gray-600)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            {t('didYouReceive', { amount: `${money(total)} ${t('sum')}`, name: payConfirm.customerName })}
          </p>
        </div>

        <div className="divider" />

        {collected > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: 10 }}>
            <span>{t('alreadyCollected')}</span>
            <strong>{money(collected)} {t('sum')}</strong>
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">{t('amountReceived')}</label>
          <input
            type="text" inputMode="numeric" className="form-input"
            value={received}
            placeholder={money(due)}
            onChange={e => setReceived(e.target.value.replace(/\D/g, ''))}
            onFocus={e => e.currentTarget.select()}
          />
          <p style={{ fontSize: '0.78rem', color: settlesFully ? '#059669' : 'var(--gray-500)', margin: '6px 0 0' }}>
            {settlesFully
              ? t('willBeFullyPaid')
              : t('balanceDueAfter', { amount: `${money(Math.max(0, total - newTotal))} ${t('sum')}` })}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={close}>{t('back')}</button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            disabled={receivedNum <= 0}
            onClick={async () => { await recordPayment(payConfirm, newTotal); close() }}
          >
            <Check size={15} strokeWidth={2.5} /> {settlesFully ? t('yesReceived') : t('recordPayment')}
          </button>
        </div>
      </div>
    </div>
  )
}
