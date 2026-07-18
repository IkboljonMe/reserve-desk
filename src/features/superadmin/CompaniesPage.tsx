'use client'

import { Plus } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { useCompaniesPage } from './useCompaniesPage'
import { CompanyList } from './components/CompanyList'
import { CompanyModal } from './components/CompanyModal'
import { CompanyAccountsModal } from './components/CompanyAccountsModal'
import Button from '@/components/ui/Button'

export default function CompaniesPage() {
  const { t } = useTranslation()
  const s = useCompaniesPage()

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold">{t('companies')}</h2>
          <p className="mt-0.5 text-gray-500 text-sm">
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
      <CompanyAccountsModal company={s.accountsCompany} onClose={s.closeAccounts} />
    </div>
  )
}
