'use client'

import { Plus } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { useCompaniesPage } from './useCompaniesPage'
import { CompanyList } from './components/CompanyList'
import { CompanyModal } from './components/CompanyModal'
import Button from '@/components/ui/Button'

export default function CompaniesPage() {
  const { t } = useTranslation()
  const s = useCompaniesPage()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('companies')}</h2>
          <p style={{ marginTop: 2, color: 'var(--gray-500)', fontSize: '0.875rem' }}>
            {t('companiesSubtitle')}
          </p>
        </div>
        <Button onClick={s.openAdd}>
          <Plus size={14} strokeWidth={2.5} />
          {t('addCompany')}
        </Button>
      </div>

      <CompanyList s={s} />
      <CompanyModal s={s} />
    </div>
  )
}
