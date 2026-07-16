'use client'

import React, { useState, useEffect } from 'react'
import Dropdown from '@/components/ui/Dropdown'
import { useTranslation } from '@/i18n'

import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'

export type ContractStatus = 'awaiting' | 'signed' | 'terminated'

export interface ContractHotel {
  _id: string
  name?: string
  shortName: string
}

export interface Contract {
  _id: string
  hotelId?: string
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
  hotels?: ContractHotel[]
  onClose: () => void
  onSave: (formData: typeof EMPTY_FORM) => Promise<void>
  saving: boolean
}

const EMPTY_FORM = {
  hotelId: '',
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

export type ContractFormData = typeof EMPTY_FORM

// yyyy-mm-dd for <input type="date">
function toDateInput(d: string | null): string {
  if (!d) return ''
  return new Date(d).toISOString().slice(0, 10)
}

export default function ContractModal({
  isOpen,
  editContract,
  hotels = [],
  onClose,
  onSave,
  saving,
}: ContractModalProps) {
  const { t } = useTranslation()


  const [form, setForm] = useState(EMPTY_FORM)

  // Only the owner spans multiple hotels; a new contract must then name one.
  const multiHotel = hotels.length > 1

  useEffect(() => {
    if (editContract) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        hotelId: editContract.hotelId || '',
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
      setForm({ ...EMPTY_FORM, hotelId: hotels[0]?._id || '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="modal max-w-[640px]" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editContract ? t('editContract') : t('addContract')}</h2>
          <Button variant="ghost" icon onClick={onClose} aria-label={t('close')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Button>
        </div>

        <form onSubmit={handleFormSubmit}>
          <div className="flex flex-col gap-3.5 max-h-[62vh] overflow-y-auto pr-1">
            {multiHotel && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{t('hotel')} *</label>
                <select
                  className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[var(--gray-800)] hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
                  required
                  value={form.hotelId}
                  disabled={!!editContract}
                  onChange={e => setForm(f => ({ ...f, hotelId: e.target.value }))}
                >
                  <option value="" disabled>{t('selectHotel')}</option>
                  {hotels.map(h => <option key={h._id} value={h._id}>{h.name || h.shortName} ({h.shortName})</option>)}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{t('organizationName')} *</label>
              <input className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[var(--gray-800)] hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]" required value={form.organizationName} onChange={e => setForm(f => ({ ...f, organizationName: e.target.value }))} placeholder={t('orgNamePlaceholder')} />
            </div>

            <div className="grid grid-cols-2 max-[480px]:grid-cols-1 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{t('inn')}</label>
                <input className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[var(--gray-800)] hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]" value={form.inn} onChange={e => setForm(f => ({ ...f, inn: e.target.value }))} placeholder="207 324 986" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{t('contractNo')}</label>
                <input className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[var(--gray-800)] hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]" value={form.contractNumber} onChange={e => setForm(f => ({ ...f, contractNumber: e.target.value }))} placeholder="SAF78" />
              </div>
            </div>

            <div className="grid grid-cols-2 max-[480px]:grid-cols-1 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{t('representativeAccountant')}</label>
                <input className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[var(--gray-800)] hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]" value={form.representativeName} onChange={e => setForm(f => ({ ...f, representativeName: e.target.value }))} placeholder={t('fullNamePlaceholder')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{t('phone')}</label>
                <input className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[var(--gray-800)] hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+998 90 123 45 67" />
              </div>
            </div>

            <div className="grid grid-cols-2 max-[480px]:grid-cols-1 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{t('signDate')}</label>
                <input className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[var(--gray-800)] hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]" type="date" value={form.signDate} onChange={e => setForm(f => ({ ...f, signDate: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{t('finishDate')}</label>
                <input className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[var(--gray-800)] hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]" type="date" value={form.finishDate} onChange={e => setForm(f => ({ ...f, finishDate: e.target.value }))} />
                <p className="mt-1.5 text-xs text-[var(--gray-500)]">{t('finishDateHint')}</p>
              </div>
            </div>

            <Dropdown
              label={t('status')}
              value={form.status}
              onChange={val => setForm(f => ({ ...f, status: val as ContractStatus }))}
              options={[
                { value: 'awaiting', label: t('awaitingSignature') },
                { value: 'signed', label: t('signed') },
                { value: 'terminated', label: t('terminated') },
              ]}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{t('contractLink')}</label>
              <input className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[var(--gray-800)] hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]" type="url" value={form.contractLink} onChange={e => setForm(f => ({ ...f, contractLink: e.target.value }))} placeholder="https://drive.google.com/…" />
              <p className="mt-1.5 text-xs text-[var(--gray-500)]">{t('contractLinkHint')}</p>
            </div>

            {/* Reminder config */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{t('renewalReminders')}</label>
              <div className="flex gap-2 flex-wrap">
                {[30, 7].map(day => {
                  const on = form.reminderDays.includes(day)
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleReminder(day)}
                      className={`inline-flex items-center gap-1.75 px-3 py-1.75 rounded-lg cursor-pointer text-[0.8125rem] font-semibold border transition-all duration-150 ${
                        on ? 'border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]' : 'border-[var(--gray-200)] bg-white text-[var(--gray-500)]'
                      }`}
                    >
                      <span className={`inline-flex w-3.75 h-3.75 rounded shrink-0 items-center justify-center text-white ${on ? 'bg-[var(--brand-500)]' : 'bg-[var(--gray-100)]'}`}>
                        {on && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      {t('daysBefore', { days: day })}
                    </button>
                  )
                })}
              </div>
              <p className="mt-1.5 text-xs text-[var(--gray-500)]">
                {t('reminderHint')}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{t('notes')}</label>
              <textarea className="w-full px-3 py-2 min-h-[64px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[var(--gray-800)] hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)] resize-y" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t('notesContractPlaceholder')} />
            </div>
          </div>

          <div className="h-px bg-surface-border my-4" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>{t('cancel')}</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner size={18} dark={false} /> : null}
              {saving ? t('saving') : editContract ? t('save') : t('addContract')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
