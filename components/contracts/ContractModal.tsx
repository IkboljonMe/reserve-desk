'use client'

import React, { useState, useEffect } from 'react'
import Dropdown from '@/components/ui/Dropdown'

export type ContractStatus = 'awaiting' | 'signed' | 'terminated'

export interface Contract {
  _id: string
  organizationName: string
  inn: string
  representativeName: string
  phone: string
  contractNumber: string
  signDate: string | null
  finishDate: string | null
  status: ContractStatus
  contractLink: string
  notes: string
  reminderDays: number[]
  dismissedReminders: number[]
}

interface ContractModalProps {
  isOpen: boolean
  editContract: Contract | null
  onClose: () => void
  onSave: (formData: typeof EMPTY_FORM) => Promise<void>
  saving: boolean
}

const EMPTY_FORM = {
  organizationName: '',
  inn: '',
  representativeName: '',
  phone: '',
  contractNumber: '',
  signDate: '',
  finishDate: '',
  status: 'awaiting' as ContractStatus,
  contractLink: '',
  notes: '',
  reminderDays: [30, 7] as number[],
}

// yyyy-mm-dd for <input type="date">
function toDateInput(d: string | null): string {
  if (!d) return ''
  return new Date(d).toISOString().slice(0, 10)
}

export default function ContractModal({
  isOpen,
  editContract,
  onClose,
  onSave,
  saving,
}: ContractModalProps) {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (editContract) {
      setForm({
        organizationName: editContract.organizationName || '',
        inn: editContract.inn || '',
        representativeName: editContract.representativeName || '',
        phone: editContract.phone || '',
        contractNumber: editContract.contractNumber || '',
        signDate: toDateInput(editContract.signDate),
        finishDate: toDateInput(editContract.finishDate),
        status: editContract.status || 'awaiting',
        contractLink: editContract.contractLink || '',
        notes: editContract.notes || '',
        reminderDays: editContract.reminderDays || [30, 7],
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [editContract, isOpen])

  const toggleReminder = (day: number) => {
    setForm(f => {
      const idx = f.reminderDays.indexOf(day)
      const next = [...f.reminderDays]
      if (idx > -1) next.splice(idx, 1)
      else next.push(day)
      return { ...f, reminderDays: next }
    })
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h2>{editContract ? 'Edit Contract' : 'Add Contract'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleFormSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '62vh', overflowY: 'auto', paddingRight: 4 }}>
            <div className="form-group">
              <label className="form-label">Organization name *</label>
              <input className="form-input" required value={form.organizationName} onChange={e => setForm(f => ({ ...f, organizationName: e.target.value }))} placeholder='e.g. "ANOR BANK" AJ' />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">INN</label>
                <input className="form-input" value={form.inn} onChange={e => setForm(f => ({ ...f, inn: e.target.value }))} placeholder="207 324 986" />
              </div>
              <div className="form-group">
                <label className="form-label">Contract №</label>
                <input className="form-input" value={form.contractNumber} onChange={e => setForm(f => ({ ...f, contractNumber: e.target.value }))} placeholder="SAF78" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Representative / accountant</label>
                <input className="form-input" value={form.representativeName} onChange={e => setForm(f => ({ ...f, representativeName: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+998 90 123 45 67" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Sign date</label>
                <input className="form-input" type="date" value={form.signDate} onChange={e => setForm(f => ({ ...f, signDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Finish date</label>
                <input className="form-input" type="date" value={form.finishDate} onChange={e => setForm(f => ({ ...f, finishDate: e.target.value }))} />
                <p style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--gray-500)' }}>When the agreement ends — drives renewal reminders.</p>
              </div>
            </div>

            <Dropdown
              label="Status"
              value={form.status}
              onChange={val => setForm(f => ({ ...f, status: val as ContractStatus }))}
              options={[
                { value: 'awaiting', label: 'Awaiting signature' },
                { value: 'signed', label: 'Signed' },
                { value: 'terminated', label: 'Terminated' },
              ]}
            />

            <div className="form-group">
              <label className="form-label">Contract link</label>
              <input className="form-input" type="url" value={form.contractLink} onChange={e => setForm(f => ({ ...f, contractLink: e.target.value }))} placeholder="https://drive.google.com/…" />
              <p style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--gray-500)' }}>Paste a shareable link (Google Drive, etc.). Opens in a new tab.</p>
            </div>

            {/* Reminder config */}
            <div className="form-group">
              <label className="form-label">Renewal reminders</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[30, 7].map(day => {
                  const on = form.reminderDays.includes(day)
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleReminder(day)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '7px 12px',
                        borderRadius: 9,
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        border: on ? '1px solid var(--brand-500)' : '1px solid var(--gray-200)',
                        background: on ? 'var(--brand-50)' : '#fff',
                        color: on ? 'var(--brand-700)' : 'var(--gray-500)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ display: 'inline-flex', width: 15, height: 15, borderRadius: 4, alignItems: 'center', justifyContent: 'center', background: on ? 'var(--brand-500)' : 'var(--gray-100)', color: '#fff' }}>
                        {on && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      {day} days before
                    </button>
                  )
                })}
              </div>
              <p style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--gray-500)' }}>
                You&apos;ll be notified on the Notifications page at each selected point before the finish date, and again once it expires.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Terms, discount rate, special conditions…" style={{ minHeight: 64 }} />
            </div>
          </div>

          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : null}
              {saving ? 'Saving…' : editContract ? 'Save Changes' : 'Add Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
