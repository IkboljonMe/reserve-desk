'use client'

import { X, Check } from 'lucide-react'
import { useTranslation } from '@/i18n'
import Spinner from '@/components/ui/Spinner'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { OrdersPageState } from '../useOrdersPage'

const money = (v: number) => v.toLocaleString('en-US').replace(/,/g, ' ')
const toInt = (v: string) => Math.max(0, Number(v.replace(/\D/g, '')) || 0)

// Presets reuse the tier names verbatim (brand text, not translated chrome).
const PRESETS: { key: 'standard' | 'pro' | 'vip'; name: string }[] = [
  { key: 'standard', name: 'Standard' },
  { key: 'pro', name: 'Pro' },
  { key: 'vip', name: 'VIP' },
]
const DISCOUNTS = [0, 5, 10]

export function OrderModal({ s }: { s: OrdersPageState }) {
  const { t } = useTranslation()
  const { modalOpen, editOrder, closeModal, handleSave, saving, form, setField, offerings } = s
  if (!modalOpen) return null

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h2>{editOrder ? t('editOrder') : t('newOrder')}</h2>
          <Button variant="ghost" icon onClick={closeModal} aria-label={t('close')}>
            <X size={18} />
          </Button>
        </div>

        <form onSubmit={handleSave}>
          <div className="flex flex-col gap-4">
            {/* Prospect / business */}
            <Input
              label={`${t('businessName')} *`}
              required
              autoFocus
              value={form.businessName}
              onChange={e => setField('businessName', e.target.value)}
            />
            <div className="flex gap-3 flex-col sm:flex-row">
              <Input containerClassName="flex-1" label={t('contactName')} value={form.contactName} onChange={e => setField('contactName', e.target.value)} />
              <Input containerClassName="flex-1" label={t('contactPhone')} value={form.contactPhone} onChange={e => setField('contactPhone', e.target.value)} />
            </div>

            {/* Presets */}
            <div className="form-group">
              <label className="form-label">{t('quickStart')}</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => s.applyPreset(p.key)}
                    className="px-3 py-1.5 text-[0.8rem] font-semibold border border-gray-200 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-600"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Offering picker */}
            <div className="form-group">
              <label className="form-label">{t('items')}</label>
              <div className="flex flex-col gap-1.5">
                {offerings.map(o => {
                  const line = form.lines[o.key]
                  const selected = !!line
                  const lineTotal = selected ? line.unitPrice * (o.unit === 'flat' ? 1 : line.quantity) : 0
                  return (
                    <div key={o.key} className={`border ${selected ? 'border-brand-500 bg-brand-50/40' : 'border-gray-200'}`}>
                      <button
                        type="button"
                        onClick={() => s.toggleOffering(o.key)}
                        aria-pressed={selected}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left"
                      >
                        <span className={`inline-flex items-center justify-center w-4 h-4 shrink-0 border ${selected ? 'bg-brand-500 border-brand-500 text-white' : 'border-gray-300 bg-white'}`}>
                          {selected && <Check size={11} strokeWidth={3} />}
                        </span>
                        <span className="flex-1 text-[0.85rem] font-medium text-gray-800">{o.name}</span>
                        {selected && (
                          <span className="text-[0.82rem] font-semibold text-gray-900 whitespace-nowrap">{money(lineTotal)} {t('sum')}</span>
                        )}
                      </button>

                      {selected && (
                        <div className="flex items-end gap-3 px-3 pb-2.5 pt-0.5 flex-wrap">
                          {o.unit !== 'flat' && (
                            <label className="flex flex-col gap-1">
                              <span className="text-[0.72rem] text-gray-500 font-medium">
                                {t(o.unit === 'per_room' ? 'roomsCount' : 'servicesCount')}
                              </span>
                              <input
                                className="form-input w-24 py-1.5"
                                inputMode="numeric"
                                value={String(line.quantity)}
                                onChange={e => s.setLineQty(o.key, Math.max(1, toInt(e.target.value)))}
                              />
                            </label>
                          )}
                          <label className="flex flex-col gap-1">
                            <span className="text-[0.72rem] text-gray-500 font-medium">{t('unitPriceMonthly')}</span>
                            <input
                              className="form-input w-36 py-1.5"
                              inputMode="numeric"
                              value={line.unitPrice ? money(line.unitPrice) : ''}
                              placeholder="0"
                              onChange={e => s.setLinePrice(o.key, toInt(e.target.value))}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Summary: cycle, discount, total */}
            <div className="border border-gray-200 bg-gray-50 p-3 flex flex-col gap-3">
              <div className="flex justify-between text-[0.85rem]">
                <span className="text-gray-600">{t('monthlySubtotal')}</span>
                <span className="font-semibold text-gray-900">{money(s.subtotal)} {t('sum')}</span>
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[0.85rem] text-gray-600">{t('billingCycle')}</span>
                <div className="flex gap-1">
                  {(['monthly', 'yearly'] as const).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setField('billingCycle', c)}
                      className={`px-3 py-1.5 text-[0.8rem] font-semibold border ${form.billingCycle === c ? 'border-brand-500 bg-brand-500 text-white' : 'border-gray-200 bg-white text-gray-700'}`}
                    >
                      {t(c === 'yearly' ? 'billingYearly' : 'billingMonthly')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[0.85rem] text-gray-600">{t('discount')}</span>
                <div className="flex gap-1 items-center">
                  {DISCOUNTS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setField('discountPercent', d)}
                      className={`px-2.5 py-1.5 text-[0.8rem] font-semibold border ${form.discountPercent === d ? 'border-brand-500 bg-brand-500 text-white' : 'border-gray-200 bg-white text-gray-700'}`}
                    >
                      {d}%
                    </button>
                  ))}
                  <div className="flex items-center border border-gray-200 bg-white">
                    <input
                      className="w-14 py-1.5 px-2 text-[0.8rem] outline-none bg-transparent"
                      inputMode="numeric"
                      value={String(form.discountPercent)}
                      onChange={e => setField('discountPercent', Math.min(100, toInt(e.target.value)))}
                    />
                    <span className="pr-2 text-gray-400 text-[0.8rem]">%</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-200" />
              <div className="flex justify-between items-baseline">
                <span className="text-[0.85rem] font-semibold text-gray-700">
                  {t('total')} <span className="text-[0.72rem] text-gray-500 font-normal">({t(form.billingCycle === 'yearly' ? 'perYear' : 'perMonth')})</span>
                </span>
                <span className="text-[1.5rem] font-extrabold tracking-tight text-gray-900">{money(s.total)} <span className="text-[0.8rem] font-medium text-gray-500">{t('sum')}</span></span>
              </div>
            </div>

            {/* Payment terms */}
            <div className="flex gap-3 flex-col sm:flex-row">
              <Input
                containerClassName="flex-1"
                label={t('paymentMethod')}
                placeholder="Payme, Click, cash…"
                value={form.paymentMethod}
                onChange={e => setField('paymentMethod', e.target.value)}
              />
              <Input
                containerClassName="flex-1"
                label={t('paymentDate')}
                type="date"
                value={form.paymentDate}
                onChange={e => setField('paymentDate', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('notes')}</label>
              <textarea className="form-input" rows={2} value={form.note} onChange={e => setField('note', e.target.value)} />
            </div>
          </div>

          <div className="h-px bg-surface-border my-4" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>{t('cancel')}</Button>
            <Button type="submit" disabled={saving || Object.keys(form.lines).length === 0}>
              {saving ? <Spinner size={18} dark={false} /> : null}
              {saving ? t('saving') : editOrder ? t('save') : t('createOrder')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
