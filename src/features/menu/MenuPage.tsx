'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, UtensilsCrossed } from 'lucide-react'
import { useTranslation } from '@/i18n'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import { money } from '@/lib/bookingHelpers'
import { useMenuPage } from './useMenuPage'
import { CategoryModal } from './components/CategoryModal'
import { ProductModal } from './components/ProductModal'

const CARD = 'bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[var(--radius-lg)] shadow-sm'

export default function MenuPage() {
  const { t, lang } = useTranslation()
  const s = useMenuPage()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1>{t('menu')}</h1>
          <p className="mt-1">{t('menuSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {s.hotels.length > 1 && (
            <div className="w-[200px]">
              <Dropdown
                value={s.hotelId}
                onChange={s.setHotelId}
                options={s.hotels.map(h => ({ value: h._id, label: h.name }))}
                ariaLabel={t('hotel')}
              />
            </div>
          )}
          <Button leftIcon={<Plus size={14} strokeWidth={2.5} />} onClick={s.openAddCategory}>{t('addCategory')}</Button>
        </div>
      </div>

      {s.loading ? (
        <p className="text-[var(--gray-400)] text-sm">{t('loading')}</p>
      ) : s.categories.length === 0 ? (
        <div className={`${CARD} p-10 flex flex-col items-center text-center gap-2`}>
          <UtensilsCrossed size={26} className="text-[var(--gray-400)]" />
          <h3 className="text-[var(--gray-700)] font-bold">{t('noCategoriesYet')}</h3>
          <p className="text-[var(--gray-500)] text-sm">{t('noCategoriesDesc')}</p>
          <Button className="mt-2" leftIcon={<Plus size={14} strokeWidth={2.5} />} onClick={s.openAddCategory}>{t('addCategory')}</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {s.categories.map(cat => {
            const prods = s.productsByCategory(cat._id)
            const cname = cat.nameI18n[lang] || cat.name
            return (
              <div key={cat._id} className={CARD}>
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--surface-border)]">
                  <h2 className="text-[1rem] font-bold text-[var(--gray-800)] m-0">{cname}</h2>
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" leftIcon={<Plus size={13} strokeWidth={2.5} />} onClick={() => s.openAddProduct(cat._id)}>
                      {t('addProduct')}
                    </Button>
                    <Button variant="ghost" icon onClick={() => s.openEditCategory(cat)} aria-label={t('edit')}><Pencil size={14} /></Button>
                    {confirmId === cat._id ? (
                      <span className="inline-flex items-center gap-1">
                        <Button variant="danger" size="sm" onClick={() => { s.removeCategory(cat._id); setConfirmId(null) }}>{t('delete')}</Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>{t('cancel')}</Button>
                      </span>
                    ) : (
                      <Button variant="ghost" icon onClick={() => setConfirmId(cat._id)} aria-label={t('delete')}>
                        <Trash2 size={14} className="text-[var(--danger)]" />
                      </Button>
                    )}
                  </div>
                </div>

                {prods.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-[var(--gray-400)]">{t('noProductsYet')}</p>
                ) : (
                  <ul className="list-none m-0 p-0 divide-y divide-[var(--surface-border)]">
                    {prods.map(p => {
                      const pname = p.nameI18n[lang] || p.name
                      return (
                        <li key={p._id} className="flex items-center gap-3 px-4 py-2.5">
                          {p.imageUrl
                            // eslint-disable-next-line @next/next/no-img-element -- arbitrary hotel-supplied URLs; next/image needs configured domains
                            ? <img src={p.imageUrl} alt="" className="w-9 h-9 rounded-md object-cover shrink-0" />
                            : <span className="w-9 h-9 rounded-md bg-[var(--gray-100)] shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold text-[0.9rem] truncate ${p.available ? 'text-[var(--gray-800)]' : 'text-[var(--gray-400)] line-through'}`}>{pname}</span>
                              {!p.available && <span className="text-[0.68rem] font-bold text-[var(--gray-400)] uppercase">{t('unavailable')}</span>}
                            </div>
                          </div>
                          <span className="text-[0.85rem] font-bold text-[var(--gray-700)] tabular-nums whitespace-nowrap">{money(p.price)} {t('sum')}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button variant="ghost" icon onClick={() => s.openEditProduct(p)} aria-label={t('edit')}><Pencil size={14} /></Button>
                            {confirmId === p._id ? (
                              <span className="inline-flex items-center gap-1">
                                <Button variant="danger" size="sm" onClick={() => { s.removeProduct(p._id); setConfirmId(null) }}>{t('delete')}</Button>
                                <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>{t('cancel')}</Button>
                              </span>
                            ) : (
                              <Button variant="ghost" icon onClick={() => setConfirmId(p._id)} aria-label={t('delete')}>
                                <Trash2 size={14} className="text-[var(--danger)]" />
                              </Button>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      <CategoryModal s={s} />
      <ProductModal s={s} />
    </div>
  )
}
