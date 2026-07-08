'use client'

import IncomeAnalytics from './components/IncomeAnalytics'
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
      <div className="card" style={{ padding: '1.25rem 1.4rem' }}>
        <IncomeAnalytics analytics={s.analytics} loading={s.loading} perService={s.perService} />
      </div>

      {/* Zone B — Bookings explorer */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
