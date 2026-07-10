'use client'

import { Building2, MapPin, Trash2, Plus, Check, X, BedDouble, Pencil } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { displayCode } from '../utils'
import { SkeletonCard } from '@/components/ui/Skeleton'
import type { HotelsRoomsPageState } from '../useHotelsRoomsPage'

export function HotelsSection({ s }: { s: HotelsRoomsPageState }) {
  const { t } = useTranslation()
  const { hotels, loading, openHotelModal, openEditHotel, roomsByHotel, hotelDeleteConfirm, setHotelDeleteConfirm, handleDeleteHotel } = s

  return (
    <section>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={18} style={{ color: 'var(--brand-600)' }} /> {t('hotels')}
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: 2 }}>
            {t('hotelCodeDesc')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={openHotelModal}>
            <Plus size={15} strokeWidth={2.5} /> {t('addHotel')}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : hotels.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Building2 size={26} /></div>
            <h3>{t('noHotelsAdded')}</h3>
            <p>{t('noHotelsDesc')}</p>
            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={openHotelModal}>{t('addFirstHotel')}</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.875rem' }}>
          {hotels.map(hotel => {
            const roomCount = (roomsByHotel.get(hotel._id) || []).length
            return (
              <div key={hotel._id} className="card" style={{ padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: 46, height: 40, padding: '0 10px', borderRadius: 10,
                    background: 'var(--brand-500)', color: '#fff',
                    fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '0.04em',
                    flexShrink: 0,
                  }}>
                    {displayCode(hotel)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {hotel.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} /> {hotel.location || t('noLocationSet')}
                    </div>
                  </div>
                  {hotelDeleteConfirm === hotel._id ? (
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteHotel(hotel._id)} aria-label={t('confirmDeleteHotel')}><Check size={14} /></button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setHotelDeleteConfirm(null)} aria-label={t('cancelDelete')}><X size={14} /></button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEditHotel(hotel)} title={t('editHotelAria')} aria-label={t('editHotelAria')}>
                        <Pencil size={15} />
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setHotelDeleteConfirm(hotel._id)} title={t('deleteHotelAria')} aria-label={t('deleteHotelAria')}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--gray-500)', paddingTop: 10, borderTop: '1px solid var(--surface-border)' }}>
                  <BedDouble size={13} />
                  <span className="tabular-nums">{roomCount}</span> {roomCount === 1 ? t('roomLower') : t('roomsLower')}
                  {hotel.roomTypes && hotel.roomTypes.length > 0 && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
                      {hotel.roomTypes.slice(0, 3).map(rt => <span key={rt} style={{ background: 'var(--brand-50)', color: 'var(--brand-600)', padding: '2px 6px', borderRadius: 6, fontWeight: 600, fontSize: '0.68rem' }}>{rt}</span>)}
                      {hotel.roomTypes.length > 3 && <span>+{hotel.roomTypes.length - 3}</span>}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
