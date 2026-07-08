'use client'

import { Plus } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { useClientGroupsPage } from './useClientGroupsPage'
import { GroupList } from './components/GroupList'
import { GroupModal } from './components/GroupModal'

export default function ClientGroupsPage() {
  const { t } = useTranslation()
  const s = useClientGroupsPage()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('clientGroups')}</h2>
          <p style={{ marginTop: 2, color: 'var(--gray-500)', fontSize: '0.875rem' }}>
            {t('clientGroupsSubtitle')}
          </p>
        </div>
        <button className="btn btn-primary" onClick={s.openAdd}>
          <Plus size={14} strokeWidth={2.5} />
          {t('addGroup')}
        </button>
      </div>

      <GroupList s={s} />
      <GroupModal s={s} />
    </div>
  )
}
