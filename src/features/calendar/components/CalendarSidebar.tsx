'use client'

import { Building2, Wallet } from 'lucide-react'
import { getServiceIcon } from '@/lib/serviceIcons'
import { svcId, money } from '@/lib/bookingHelpers'
import { useTranslation } from '@/i18n'
import type { CalendarPageState } from '../useCalendarPage'

export function CalendarSidebar({ s }: { s: CalendarPageState }) {
  const { t } = useTranslation()
  const {
    summary, view, hotels, services, selectedHotels, setSelectedHotels, allHotelsSelected,
    selectedServices, setSelectedServices, allSelected, visibleBookings, serviceHotel,
  } = s

  return (
    <div className="cal-sidebar">
      {/* Range summary */}
      <div className="card" style={{ padding: '0.9rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-800)', lineHeight: 1 }}>{summary.count}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{t('bookings')}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-600)', lineHeight: 1 }}>{money(summary.revenue)}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{t('sum')} · {view === 'day' ? t('day') : view === 'week' ? t('periodWeek') : t('periodMonth')}</div>
          </div>
        </div>
        {summary.revenue > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--gray-500)', borderTop: '1px dashed var(--gray-200)', paddingTop: 8 }}>
            <Wallet size={13} style={{ color: '#10b981' }} />
            <span style={{ fontWeight: 700, color: '#059669' }}>{money(summary.collected)}</span> {t('collected')}
            {summary.collected < summary.revenue && (
              <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#d97706' }}>{money(summary.revenue - summary.collected)} {t('due')}</span>
            )}
          </div>
        )}
      </div>

      {/* Hotel filter */}
      {hotels.length > 0 && (
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.8125rem', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Building2 size={14} style={{ color: 'var(--gray-400)' }} /> {t('hotels')}
            </h3>
            <button
              onClick={() => setSelectedHotels(allHotelsSelected ? new Set() : new Set(hotels.map(h => h._id)))}
              style={{ background: 'none', border: 'none', color: 'var(--brand-600)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
            >
              {allHotelsSelected ? t('clear') : t('all')}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {hotels.map(h => {
              const checked = selectedHotels.has(h._id)
              const count = visibleBookings.filter(b => (serviceHotel.get(svcId(b)) || '') === h._id).length
              return (
                <button
                  key={h._id}
                  onClick={() => setSelectedHotels(prev => {
                    const next = new Set(prev)
                    if (checked) next.delete(h._id); else next.add(h._id)
                    return next
                  })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left',
                    padding: '5px 7px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: checked ? 'var(--brand-50)' : 'transparent',
                    opacity: checked ? 1 : 0.5, transition: 'all .12s', fontFamily: 'inherit',
                  }}
                >
                  <span style={{
                    minWidth: 30, height: 22, padding: '0 6px', borderRadius: 6, flexShrink: 0,
                    background: checked ? 'var(--brand-500)' : 'var(--gray-200)',
                    color: checked ? '#fff' : 'var(--gray-500)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.66rem', letterSpacing: '0.03em',
                  }}>
                    {h.shortName}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--gray-700)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: checked ? 600 : 400 }}>
                    {h.name}
                  </span>
                  {count > 0 && (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--brand-600)', background: 'var(--brand-100)', borderRadius: 999, padding: '1px 7px' }}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Service filter / legend */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '0.8125rem', margin: 0 }}>{t('services')}</h3>
          <button
            onClick={() => setSelectedServices(allSelected ? new Set() : new Set(services.map(svc => svc._id)))}
            style={{ background: 'none', border: 'none', color: 'var(--brand-600)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
          >
            {allSelected ? t('clear') : t('all')}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {services.map(svc => {
            const checked = selectedServices.has(svc._id)
            const count = visibleBookings.filter(b => svcId(b) === svc._id && b.status !== 'cancelled').length
            return (
              <button
                key={svc._id}
                onClick={() => setSelectedServices(prev => {
                  const next = new Set(prev)
                  if (checked) next.delete(svc._id); else next.add(svc._id)
                  return next
                })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left',
                  padding: '5px 7px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: checked ? `${svc.color}0f` : 'transparent',
                  opacity: checked ? 1 : 0.5, transition: 'all .12s', fontFamily: 'inherit',
                }}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: `${svc.color}22`, color: svc.color,
                  border: `1.5px solid ${checked ? svc.color : 'transparent'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {getServiceIcon(svc.name)}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--gray-700)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: checked ? 600 : 400 }}>
                  {svc.name}
                </span>
                {count > 0 && (
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: svc.color, background: `${svc.color}18`, borderRadius: 999, padding: '1px 7px' }}>{count}</span>
                )}
              </button>
            )
          })}
          {services.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{t('noServicesYet')}</p>}
        </div>
      </div>
    </div>
  )
}
