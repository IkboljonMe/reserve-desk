'use client'

import { X } from 'lucide-react'
import { useTranslation } from '@/i18n'
import Spinner from '@/components/ui/Spinner'
import Input from '@/components/ui/Input'
import type { PlansPageState } from '../usePlansPage'
import Button from '@/components/ui/Button'

export function PlanModal({ s }: { s: PlansPageState }) {
  const { t } = useTranslation()
  const { modalOpen, editPlan, closeModal, handleSave, saving, form, setForm, setName, setKey } = s
  if (!modalOpen) return null

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h2>{editPlan ? t('editPlan') : t('addPlan')}</h2>
          <Button variant="ghost" icon onClick={closeModal} aria-label={t('close')}>
            <X size={18} />
          </Button>
        </div>

        <form onSubmit={handleSave}>
          <div className="flex flex-col gap-4">
            <Input
              label={`${t('planName')} *`}
              required
              autoFocus
              value={form.name}
              onChange={e => setName(e.target.value)}
            />

            {!editPlan && (
              <Input
                label={`${t('planKey')} *`}
                required
                value={form.key}
                onChange={e => setKey(e.target.value)}
                helperText={t('planKeyHelp')}
              />
            )}

            <div className="flex gap-3">
              <Input
                containerClassName="flex-1"
                label={t('planPrice')}
                inputMode="numeric"
                value={form.price ? String(form.price) : ''}
                placeholder="0"
                onChange={e => setForm(f => ({ ...f, price: Math.max(0, Number(e.target.value.replace(/\D/g, '')) || 0) }))}
                helperText={t('planPriceHelp')}
              />
            </div>
          </div>

          <div className="h-px bg-surface-border my-4" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>{t('cancel')}</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner size={18} dark={false} /> : null}
              {saving ? t('saving') : editPlan ? t('save') : t('addPlan')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
