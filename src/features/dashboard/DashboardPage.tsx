'use client'

import IncomeAnalytics from './components/IncomeAnalytics'
import { OccupancyCard } from './components/OccupancyCard'
import { PaymentsByMethodCard } from './components/PaymentsByMethodCard'
import BookingDrawer from './components/BookingDrawer'
import { useDashboardPage } from './useDashboardPage'
import { DashboardHeader } from './components/DashboardHeader'
import { BookingsToolbar } from './components/BookingsToolbar'
import { BookingsTable } from './components/BookingsTable'
import { usePlanFeature } from '@/components/layout/PlanFeaturesContext'

export default function DashboardPage() {
  const s = useDashboardPage()
  // Revenue analytics (income breakdown + payments-by-method) are a plan
  // feature; businesses without it still get occupancy and the bookings table.
  const showAnalytics = usePlanFeature('analytics')

  return (
    <div className="flex flex-col gap-5">
      <DashboardHeader s={s} />

      {/* Zone A — Income analytics */}
      {showAnalytics && (
        <div>
          <IncomeAnalytics analytics={s.analytics} loading={s.loading} perService={s.perService} />
        </div>
      )}

      {/* Payments by method */}
      {showAnalytics && !s.loading && <PaymentsByMethodCard s={s} />}

      {/* Occupancy */}
      {!s.loading && <OccupancyCard s={s} />}

      {/* Zone B — Bookings explorer (separated by a hairline, not a box) */}
      <div className="overflow-hidden border-t border-surface-border pt-6">
        <BookingsToolbar s={s} />
        <BookingsTable s={s} />
      </div>

      {s.detailId && (
        <BookingDrawer
          id={s.detailId}
          hotels={s.hotels}
          serviceHotel={s.serviceHotel}
          onClose={() => s.setDetailId(null)}
          onChanged={(id, changes) => s.patchLocal(id, changes)}
          onDeleted={(id) => s.handleDeleted(id)}
          router={s.router}
          showToast={s.showToast}
        />
      )}
    </div>
  )
}
