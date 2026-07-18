'use client'

import { Plus } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { usePlansPage } from './usePlansPage'
import { PlanList } from './components/PlanList'
import { PlanModal } from './components/PlanModal'
import Button from '@/components/ui/Button'

export default function PlansPage() {
  const { t } = useTranslation()
  const s = usePlansPage()

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold">{t('plans')}</h2>
          <p className="mt-0.5 text-gray-500 text-sm">{t('plansSubtitle')}</p>
        </div>
        <Button onClick={s.openAdd}>
          <Plus size={14} strokeWidth={2.5} />
          {t('addPlan')}
        </Button>
      </div>

      <PlanList s={s} />
      <PlanModal s={s} />
    </div>
  )
}
