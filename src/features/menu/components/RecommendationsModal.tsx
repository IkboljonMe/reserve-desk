'use client'

import { useMemo } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Dropdown from '@/components/ui/Dropdown'
import { useTranslation, type DictionaryKeys } from '@/i18n'
import { useToast } from '@/components/ToastProvider'
import { getRecommendations, createRecommendation, deleteRecommendation } from '@/lib/api/menu'
import type { MenuProduct, MenuRecommendation } from '../types'

// Monday-first display; `day` is the JS Date.getDay() index (0 = Sunday).
const WEEK_ORDER: { day: number; labelKey: DictionaryKeys }[] = [
  { day: 1, labelKey: 'dowMon' },
  { day: 2, labelKey: 'dowTue' },
  { day: 3, labelKey: 'dowWed' },
  { day: 4, labelKey: 'dowThu' },
  { day: 5, labelKey: 'dowFri' },
  { day: 6, labelKey: 'dowSat' },
  { day: 0, labelKey: 'dowSun' },
]

export function RecommendationsModal({
  open, onClose, hotelId, products, lang,
}: {
  open: boolean
  onClose: () => void
  hotelId: string
  products: MenuProduct[]
  lang: string
}) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const qc = useQueryClient()

  const recsKey = ['menu', 'recommendations', hotelId] as const
  const recsQuery = useQuery<MenuRecommendation[]>({
    queryKey: recsKey,
    queryFn: () => getRecommendations(hotelId),
    enabled: open && !!hotelId,
  })
  const loading = recsQuery.isLoading

  const addMut = useMutation({
    mutationFn: (vars: { dayOfWeek: number; productId: string }) => createRecommendation({ hotelId, ...vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: recsKey }),
    onError: () => showToast(t('saveFailed'), 'error'),
  })
  const removeMut = useMutation({
    mutationFn: (id: string) => deleteRecommendation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: recsKey }),
    onError: () => showToast(t('deleteFailed'), 'error'),
  })
  const busy = addMut.isPending || removeMut.isPending

  const byDay = useMemo(() => {
    const map: Record<number, MenuRecommendation[]> = {}
    for (const r of recsQuery.data ?? []) (map[r.dayOfWeek] ??= []).push(r)
    return map
  }, [recsQuery.data])

  const add = (dayOfWeek: number, productId: string) => {
    if (!productId || busy) return
    addMut.mutate({ dayOfWeek, productId })
  }

  return (
    <Modal open={open} onClose={onClose} title={t('recommendationsTitle')} size="lg" closeLabel={t('close')}>
      <p className="text-sm text-[var(--gray-500)] mb-4">{t('recommendationsDesc')}</p>
      {loading ? (
        <p className="text-center text-[var(--gray-400)] py-8">{t('loading')}</p>
      ) : products.length === 0 ? (
        <p className="text-center text-[var(--gray-400)] text-sm py-8">{t('noProductsForRecommend')}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {WEEK_ORDER.map(({ day, labelKey }) => {
            const featured = byDay[day] ?? []
            const featuredIds = new Set(featured.map(r => r.productId))
            const available = products.filter(p => !featuredIds.has(p._id))
            return (
              <div key={day} className="rounded-xl border border-[var(--surface-border)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-[var(--gray-800)] m-0">{t(labelKey)}</h3>
                  <div className="w-56 shrink-0">
                    <Dropdown
                      value=""
                      onChange={v => add(day, v)}
                      disabled={busy || available.length === 0}
                      placeholder={t('featureADish')}
                      options={available.map(p => ({ value: p._id, label: p.nameI18n?.[lang as 'en'] || p.name }))}
                      ariaLabel={t('featureADish')}
                    />
                  </div>
                </div>
                {featured.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {featured.map(r => (
                      <span key={r._id} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
                        {r.product?.nameI18n?.[lang as 'en'] || r.product?.name}
                        <button
                          type="button"
                          onClick={() => removeMut.mutate(r._id)}
                          disabled={busy}
                          className="text-brand-400 hover:text-brand-700"
                          aria-label={t('remove')}
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
