'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from '@/i18n'
import Button from '@/components/ui/Button'

export interface MenuItem { name: string; qty: number; price: number }

const SERVICE_FEE_RATE = 0.1
const fmt = (v: number) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

// Optional food/order request attached to a booking (e.g. for a SPA & Pool
// event): a list of priced line items plus a "ready by" time. Subtotal /
// service fee / total mirror exactly what the Telegram message shows
// (src/lib/telegram.ts › SERVICE_FEE_RATE must stay in sync with this one).
export function MenuItemsEditor({
  items,
  onAdd,
  onUpdate,
  onRemove,
  readyTime,
  onReadyTimeChange,
}: {
  items: MenuItem[]
  onAdd: () => void
  onUpdate: (index: number, patch: Partial<MenuItem>) => void
  onRemove: (index: number) => void
  readyTime: string
  onReadyTimeChange: (v: string) => void
}) {
  const { t } = useTranslation()
  const subtotal = items.reduce((sum, it) => sum + it.qty * it.price, 0)
  const fee = Math.round(subtotal * SERVICE_FEE_RATE)
  const total = subtotal + fee

  return (
    <div>
      <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>{t('menuOptional')}</label>

      {items.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 4, padding: '0 2px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          <span style={{ flex: 1 }}>{t('menuItemName')}</span>
          <span style={{ width: 56, textAlign: 'center' }}>{t('menuItemQty')}</span>
          <span style={{ width: 100, textAlign: 'right' }}>{t('menuItemPrice')}</span>
          <span style={{ width: 28 }} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              className="form-input" style={{ flex: 1, padding: '6px 8px', fontSize: '0.82rem' }}
              placeholder={t('menuPlaceholder')}
              value={item.name}
              onChange={e => onUpdate(i, { name: e.target.value })}
            />
            <input
              type="number" min={1} step={1} className="form-input"
              style={{ width: 56, padding: '6px 4px', fontSize: '0.82rem', textAlign: 'center' }}
              value={item.qty}
              onChange={e => onUpdate(i, { qty: Math.max(1, parseInt(e.target.value) || 1) })}
              onFocus={e => e.currentTarget.select()}
            />
            <input
              type="text" inputMode="numeric" className="form-input"
              style={{ width: 100, padding: '6px 8px', fontSize: '0.82rem', textAlign: 'right' }}
              value={item.price ? fmt(item.price) : ''}
              placeholder="0"
              onChange={e => onUpdate(i, { price: Number(e.target.value.replace(/\D/g, '')) || 0 })}
              onFocus={e => e.currentTarget.select()}
            />
            <Button
              type="button" variant="ghost" icon style={{ width: 28, flexShrink: 0 }}
              onClick={() => onRemove(i)} aria-label={t('delete')}
            >
              <Trash2 size={14} color="var(--danger)" />
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" size="sm" style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={onAdd}>
        <Plus size={13} /> {t('addMenuItem')}
      </Button>

      {items.length > 0 && (
        <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--gray-50)', border: '1px solid var(--gray-200)', fontSize: '0.78rem', color: 'var(--gray-600)', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t('menuSubtotal')}</span><span>{fmt(subtotal)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t('menuServiceFee')}</span><span>{fmt(fee)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--gray-800)' }}><span>{t('menuTotal')}</span><span>{fmt(total)}</span></div>
        </div>
      )}

      <div style={{ marginTop: 10, maxWidth: 160 }}>
        <label className="form-label">{t('menuReadyTime')}</label>
        <input type="time" className="form-input" value={readyTime} onChange={e => onReadyTimeChange(e.target.value)} />
      </div>
    </div>
  )
}
