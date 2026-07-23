'use client'

import { X } from 'lucide-react'
import { useTranslation } from '@/i18n'
import Spinner from '@/components/ui/Spinner'
import Input from '@/components/ui/Input'
import { FEATURE_KEYS, FEATURE_LABELS } from '@/lib/planFeatures'
import type { PlansPageState } from '../usePlansPage'
import Button from '@/components/ui/Button'

export function PlanModal({ s }: { s: PlansPageState }) {
  const { t } = useTranslation()
  const { modalOpen, editPlan, closeModal, handleSave, saving, form, setForm, setName, setKey, toggleFeature } = s
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

            <div className="form-group">
              <label className="form-label">{t('planDescription')}</label>
              <p className="mb-1.5 text-[0.75rem] text-gray-500">{t('planDescriptionPlaceholder')}</p>
              <div className="flex flex-col gap-2">
                {(['en', 'ru', 'uz'] as const).map(lng => (
                  <div key={lng} className="flex items-stretch">
                    <span className="inline-flex items-center px-2.5 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-[0.7rem] font-bold uppercase w-11 justify-center">
                      {lng}
                    </span>
                    <input
                      className="form-input rounded-l-none"
                      value={form.description[lng]}
                      onChange={e => setForm(f => ({ ...f, description: { ...f.description, [lng]: e.target.value } }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.highlight}
                onChange={e => setForm(f => ({ ...f, highlight: e.target.checked }))}
              />
              {t('planHighlight')}
            </label>

            <div className="form-group">
              <label className="form-label">{t('planFeatures')}</label>
              <div className="flex flex-col gap-2 mt-1">
                {FEATURE_KEYS.map(key => (
                  <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.features.includes(key)}
                      onChange={() => toggleFeature(key)}
                    />
                    {FEATURE_LABELS[key]}
                  </label>
                ))}
              </div>
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
