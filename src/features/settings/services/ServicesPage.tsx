'use client'

import { Plus } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { useServicesPage } from './useServicesPage'
import { ServicesStyles } from './components/ServicesStyles'
import { ServicesFilterBar } from './components/ServicesFilterBar'
import { ServicesGrid } from './components/ServicesGrid'
import { ServiceFormModal } from './components/ServiceFormModal'
import Button from '@/components/ui/Button'

export default function ServicesPage() {
  const { t } = useTranslation()
  const s = useServicesPage()

  return (
    <div>
      <ServicesStyles />

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {t('services')}
            {!s.loading && (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '1px 9px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-100)',
                marginLeft: 4,
              }}>
                {t('activeCount', { count: s.activeCount })}
              </span>
            )}
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: 2 }}>
            {t('servicesSubtitle')}
          </p>
        </div>
        <Button id="add-service-btn" onClick={s.openAddForm}>
          <Plus size={15} strokeWidth={2.5} />
          {t('addService')}
        </Button>
      </div>

      {/* ── Filter Bar ── */}
      {!s.loading && s.services.length > 0 && <ServicesFilterBar s={s} />}

      {/* ── Content ── */}
      <ServicesGrid s={s} />

      {/* ── Modal Form ── */}
      <ServiceFormModal s={s} />
    </div>
  )
}
