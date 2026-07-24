'use client'

import { Plus } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { useOrdersPage } from './useOrdersPage'
import { OrderList } from './components/OrderList'
import { OrderModal } from './components/OrderModal'
import { ProvisionModal } from './components/ProvisionModal'
import Button from '@/components/ui/Button'

export default function OrdersPage() {
  const { t } = useTranslation()
  const s = useOrdersPage()

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-3">
        <div>
          <h2 className="text-lg font-bold">{t('orders')}</h2>
          <p className="mt-0.5 text-gray-500 text-sm">{t('salesOrdersSubtitle')}</p>
        </div>
        <Button onClick={s.openAdd}>
          <Plus size={14} strokeWidth={2.5} />
          {t('newOrder')}
        </Button>
      </div>

      <OrderList s={s} />
      <OrderModal s={s} />
      <ProvisionModal s={s} />
    </div>
  )
}
