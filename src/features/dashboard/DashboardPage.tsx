'use client'

import IncomeAnalytics from './components/IncomeAnalytics'
import { OccupancyCard } from './components/OccupancyCard'
import BookingDrawer from './components/BookingDrawer'
import { useDashboardPage } from './useDashboardPage'
import { DashboardStyles } from './components/DashboardStyles'
import { DashboardHeader } from './components/DashboardHeader'
import { BookingsToolbar } from './components/BookingsToolbar'
import { BookingsTable } from './components/BookingsTable'

export default function DashboardPage() {
  const s = useDashboardPage()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <DashboardStyles />

      <DashboardHeader s={s} />

      {/* Zone A — Income analytics */}
      <div>
        <IncomeAnalytics analytics={s.analytics} loading={s.loading} perService={s.perService} />
      </div>

      {/* Occupancy */}
      {!s.loading && <OccupancyCard s={s} />}

      {/* Zone B — Bookings explorer (separated by a hairline, not a box) */}
      <div style={{ overflow: 'hidden', borderTop: '1px solid var(--surface-border)', paddingTop: '1.5rem' }}>
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
