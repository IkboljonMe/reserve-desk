'use client'

import { Layers, Trash2, Plus, DoorClosed, TriangleAlert, Check, X, BedDouble, Pencil, GripVertical, Building2 } from 'lucide-react'
import { useTranslation } from '@/i18n'
import Select from '@/components/Select'
import { displayCode } from '../utils'
import type { HotelsRoomsPageState } from '../useHotelsRoomsPage'

export function RoomsSection({ s }: { s: HotelsRoomsPageState }) {
  const { t } = useTranslation()
  const {
    hotels, rooms, loading, openRoomModal, roomsByHotel, unassignedRooms, hasAnyGroupedRooms,
    assignRoomToHotel, handleDeleteRoom, openEditRoom, roomDeleteConfirm, setRoomDeleteConfirm,
    draggingRoomId, setDraggingRoomId, handleRoomDragOver, handleRoomDrop,
  } = s

  return (
    <section>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BedDouble size={18} style={{ color: 'var(--brand-600)' }} /> {t('rooms')}
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: 2 }}>
            {t('roomsSectionDesc')}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openRoomModal}>
          <Plus size={15} strokeWidth={2.5} /> {t('addRoom')}
        </button>
      </div>

      {loading ? null : rooms.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><BedDouble size={26} /></div>
            <h3>{t('noRoomsAdded')}</h3>
            <p>{t('noRoomsDesc')}</p>
            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={openRoomModal}>{t('addFirstRoom')}</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Unassigned rooms — visible so nothing is ever hidden, with a repair control */}
          {unassignedRooms.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #fcd34d' }}>
              <div style={{ padding: '0.75rem 1.25rem', background: '#fffbeb', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <TriangleAlert size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#92400e' }}>
                    {t('unassignedRoomsCount', { count: unassignedRooms.length })}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#b45309' }}>{t('unassignedHint')}</div>
                </div>
              </div>
              {unassignedRooms.map(room => (
                <div key={room._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--gray-100)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--gray-800)', fontSize: '0.9375rem', minWidth: 60 }} className="tabular-nums">
                    #{room.number}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>{t('floor')} {room.floor}</span>
                  <div style={{ flex: 1, maxWidth: 260 }}>
                    <Select
                      ariaLabel={t('assignRoomAria', { number: room.number })}
                      placeholder={t('assignToHotel')}
                      icon={<Building2 size={15} />}
                      value=""
                      onChange={v => assignRoomToHotel(room._id, v)}
                      options={hotels.map(h => ({ value: h._id, label: `${displayCode(h)} · ${h.name}` }))}
                    />
                  </div>
                  <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteRoom(room._id)} title={t('deleteRoomAria')} aria-label={t('deleteRoomAria')}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {hotels.filter(h => (roomsByHotel.get(h._id) || []).length > 0).map(hotel => {
            const hotelRooms = roomsByHotel.get(hotel._id) || []
            const floors = Array.from(new Set(hotelRooms.map(r => r.floor))).sort((a, b) => a - b)
            return (
              <div key={hotel._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  padding: '0.75rem 1.25rem',
                  background: 'var(--gray-50)',
                  borderBottom: '1px solid var(--gray-200)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: 40, height: 26, padding: '0 8px', borderRadius: 7,
                    background: 'var(--brand-500)', color: '#fff', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.03em',
                  }}>
                    {displayCode(hotel)}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--gray-700)' }}>{hotel.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--gray-400)' }} className="tabular-nums">
                    {hotelRooms.length} {hotelRooms.length === 1 ? t('roomLower') : t('roomsLower')}
                  </span>
                </div>
                {floors.map(floor => (
                  <div key={floor}>
                    <div style={{
                      padding: '0.4rem 1.25rem',
                      background: '#fff',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'var(--gray-400)',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid var(--gray-100)',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <Layers size={11} /> {t('floor')} {floor}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 1, background: 'var(--gray-200)' }}>
                      {hotelRooms.filter(r => r.floor === floor).map(room => {
                        const isDragging = draggingRoomId === room._id
                        return (
                        <div
                          key={room._id}
                          onDragOver={e => handleRoomDragOver(e, room)}
                          onDrop={() => handleRoomDrop(room.hotelId, room.floor)}
                          style={{
                            background: '#fff', padding: '0.875rem 1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                            opacity: isDragging ? 0.4 : 1,
                            transition: 'opacity 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                            <span
                              draggable
                              onDragStart={e => { setDraggingRoomId(room._id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', room._id) }}
                              onDragEnd={() => setDraggingRoomId(null)}
                              title={t('dragToReorder')}
                              aria-label={t('dragToReorderRoom')}
                              style={{
                                display: 'inline-flex', alignItems: 'center', color: 'var(--gray-300)',
                                cursor: 'grab', flexShrink: 0, touchAction: 'none',
                              }}
                            >
                              <GripVertical size={16} />
                            </span>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                              background: 'var(--brand-50)', color: 'var(--brand-600)',
                            }}>
                              <DoorClosed size={16} />
                            </span>
                            <div style={{ minWidth: 0, overflow: 'hidden' }}>
                              <div style={{ fontWeight: 700, color: 'var(--gray-800)', fontSize: '0.9375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} className="tabular-nums">
                                {displayCode(hotel)}-{room.number}
                                {room.type && (
                                  <span style={{ marginLeft: 8, fontSize: '0.7rem', fontWeight: 600, color: 'var(--brand-600)', background: 'var(--brand-50)', padding: '2px 6px', borderRadius: 6, verticalAlign: 'middle' }}>
                                    {room.type}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {roomDeleteConfirm === room._id ? (
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                              <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteRoom(room._id)} aria-label={t('confirmDeleteRoom')}><Check size={14} /></button>
                              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setRoomDeleteConfirm(null)} aria-label={t('cancelDelete')}><X size={14} /></button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEditRoom(room)} title={t('editRoomAria')} aria-label={t('editRoomAria')}>
                                <Pencil size={14} />
                              </button>
                              <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setRoomDeleteConfirm(room._id)} title={t('deleteRoomAria')} aria-label={t('deleteRoomAria')}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}

          {/* All rooms are unassigned — nudge toward assigning them */}
          {!hasAnyGroupedRooms && unassignedRooms.length > 0 && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', textAlign: 'center', padding: '0.5rem' }}>
              {t('assignRoomsAboveHint')}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
