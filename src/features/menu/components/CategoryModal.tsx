'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useTranslation } from '@/i18n'
import { LocalizedInput } from './LocalizedInput'
import type { MenuPageState } from '../useMenuPage'
import type { LocalizedText } from '../types'

const EMPTY: LocalizedText = { en: '', ru: '', uz: '' }

export function CategoryModal({ s }: { s: MenuPageState }) {
  const { t } = useTranslation()
  const [name, setName] = useState<LocalizedText>(EMPTY)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- form reset on open
    if (s.categoryOpen) setName(s.editCategory ? { ...EMPTY, ...s.editCategory.nameI18n } : EMPTY)
  }, [s.categoryOpen, s.editCategory])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const source = name.en || name.ru || name.uz
    if (!source.trim()) return
    s.saveCategory({ name: source, nameI18n: name, sourceLang: 'en' })
  }

  return (
    <Modal
      open={s.categoryOpen}
      onClose={() => s.setCategoryOpen(false)}
      title={s.editCategory ? t('editCategory') : t('addCategory')}
      size="sm"
      closeLabel={t('close')}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => s.setCategoryOpen(false)}>{t('cancel')}</Button>
          <Button type="submit" form="category-form" loading={s.saving}>{t('save')}</Button>
        </div>
      }
    >
      <form id="category-form" onSubmit={submit}>
        <LocalizedInput label={t('categoryName')} value={name} onChange={setName} placeholder={t('categoryNamePlaceholder')} />
      </form>
    </Modal>
  )
}
