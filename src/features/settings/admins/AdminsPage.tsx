'use client'

import { Plus } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { useAdminsPage } from './useAdminsPage'
import { AdminList } from './components/AdminList'
import { AdminModal } from './components/AdminModal'

export default function AdminsPage() {
  const { t } = useTranslation()
  const s = useAdminsPage()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('admins')}</h2>
          <p style={{ marginTop: 2, color: 'var(--gray-500)', fontSize: '0.875rem' }}>
            {t('adminsSubtitle')}
          </p>
        </div>
        <button className="btn btn-primary" onClick={s.openAdd} disabled={s.noHotels} title={s.noHotels ? t('addHotelFirst') : undefined}>
          <Plus size={14} strokeWidth={2.5} />
          {t('addAdmin')}
        </button>
      </div>

      <AdminList s={s} />
      <AdminModal s={s} />
    </div>
  )
}
