'use client'

import { useTranslation } from '@/i18n'
import ContractModal from './components/ContractModal'
import { useContractsPage } from './useContractsPage'
import { ContractStats } from './components/ContractStats'
import { ContractsFilters } from './components/ContractsFilters'
import { ContractsTable } from './components/ContractsTable'
import Button from '@/components/ui/Button'

export default function ContractsPage() {
  const { t } = useTranslation()
  const s = useContractsPage()

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1>{t('contracts')}</h1>
          <p style={{ marginTop: 4 }}>{t('contractsSubtitle')}</p>
        </div>
        <Button onClick={s.openAdd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          {t('addContract')}
        </Button>
      </div>

      <ContractStats stats={s.stats} />
      <ContractsFilters s={s} />
      <ContractsTable s={s} />

      {!s.loading && s.visible.length > 0 && (
        <p style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--gray-400)' }}>
          {t('showingContracts', { shown: s.visible.length, total: s.contracts.length })}
        </p>
      )}

      <ContractModal
        isOpen={s.modalOpen}
        editContract={s.editContract}
        hotels={s.hotels}
        onClose={s.closeModal}
        onSave={s.handleSave}
        saving={s.saving}
      />
    </div>
  )
}
