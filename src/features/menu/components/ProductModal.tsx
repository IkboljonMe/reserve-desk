'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import { useTranslation } from '@/i18n'
import { LocalizedInput, FIELD_INPUT } from './LocalizedInput'
import type { MenuPageState } from '../useMenuPage'
import type { LocalizedText } from '../types'

const EMPTY: LocalizedText = { en: '', ru: '', uz: '' }

export function ProductModal({ s }: { s: MenuPageState }) {
  const { t, lang } = useTranslation()
  const [categoryId, setCategoryId] = useState('')
  const [name, setName] = useState<LocalizedText>(EMPTY)
  const [desc, setDesc] = useState<LocalizedText>(EMPTY)
  const [price, setPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [available, setAvailable] = useState(true)

  // Reset the form when the modal opens (sync from the edited product).
  useEffect(() => {
    if (!s.productOpen) return
    const p = s.editProduct
    /* eslint-disable react-hooks/set-state-in-effect -- form reset on open */
    setCategoryId(p?.categoryId || s.productCategoryId || s.categories[0]?._id || '')
    setName(p ? { ...EMPTY, ...p.nameI18n } : EMPTY)
    setDesc(p ? { ...EMPTY, ...p.descI18n } : EMPTY)
    setPrice(p ? String(p.price) : '')
    setImageUrl(p?.imageUrl || '')
    setAvailable(p ? p.available : true)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [s.productOpen, s.editProduct, s.productCategoryId, s.categories])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const source = name.en || name.ru || name.uz
    if (!source.trim() || !categoryId) return
    s.saveProduct({
      categoryId,
      name: source,
      nameI18n: name,
      description: desc.en || desc.ru || desc.uz,
      descI18n: desc,
      price: Math.max(0, Math.round(Number(price) || 0)),
      imageUrl,
      available,
      sourceLang: 'en',
    })
  }

  return (
    <Modal
      open={s.productOpen}
      onClose={() => s.setProductOpen(false)}
      title={s.editProduct ? t('editProduct') : t('addProduct')}
      size="md"
      closeLabel={t('close')}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => s.setProductOpen(false)}>{t('cancel')}</Button>
          <Button type="submit" form="product-form" loading={s.saving}>{t('save')}</Button>
        </div>
      }
    >
      <form id="product-form" onSubmit={submit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{t('category')}</label>
          <Dropdown
            value={categoryId}
            onChange={setCategoryId}
            options={s.categories.map(c => ({ value: c._id, label: c.nameI18n[lang] || c.name }))}
            ariaLabel={t('category')}
          />
        </div>

        <LocalizedInput label={t('productName')} value={name} onChange={setName} />
        <LocalizedInput label={t('description')} value={desc} onChange={setDesc} textarea />

        <div className="grid grid-cols-2 max-[480px]:grid-cols-1 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{t('priceUzs')}</label>
            <input
              className={FIELD_INPUT}
              inputMode="numeric"
              value={price}
              placeholder="0"
              onChange={e => setPrice(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{t('imageUrl')}</label>
            <input
              className={FIELD_INPUT}
              value={imageUrl}
              placeholder="https://…"
              onChange={e => setImageUrl(e.target.value)}
            />
          </div>
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" className="w-4 h-4 accent-[var(--brand-500)]" checked={available} onChange={e => setAvailable(e.target.checked)} />
          <span className="text-sm text-[var(--gray-700)] font-medium">{t('availableForOrder')}</span>
        </label>
      </form>
    </Modal>
  )
}
