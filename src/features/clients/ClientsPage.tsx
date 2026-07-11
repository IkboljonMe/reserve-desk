'use client'

import { useTranslation } from '@/i18n'
import { useClientsPage } from './useClientsPage'
import { ClientsFilters } from './components/ClientsFilters'
import { ClientsTable } from './components/ClientsTable'
import { ClientModal } from './components/ClientModal'
import { ClientHistoryModal } from './components/ClientHistoryModal'

export default function ClientsPage() {
  const { t } = useTranslation()
  const s = useClientsPage()

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{t('clients')}</h1>
          <p style={{ marginTop: 4 }}>{t('manageClients')}</p>
        </div>
        <button className="btn btn-primary" onClick={s.openAdd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          {t('addClient')}
        </button>
      </div>

      <ClientsFilters s={s} />
      <ClientsTable s={s} />
      <ClientModal s={s} />
      {s.historyClient && <ClientHistoryModal key={s.historyClient._id} s={s} />}
    </div>
  )
}
