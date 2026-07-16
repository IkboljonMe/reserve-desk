'use client'

import { BedDouble, Check, Search, UserPlus, X } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { useIsMobile } from '@/hooks/useIsMobile'
import { MenuItemsEditor } from '@/components/ui/MenuItemsEditor'
import { AddClientModal } from './AddClientModal'
import type { BookingWizard } from '../useBookingWizard'
import Button from '@/components/ui/Button'

// Guest / room details, shown once the plan (type + category + duration/price) is ready.
export function GuestSection({ w }: { w: BookingWizard }) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const {
    bookingType, planReady, categoryMeta,
    clientSearch, setClientSearch, clientResults, selectedClientId, pickClient, clearClient,
    categoryRooms, selectedRoomId, pickRoom, roomLabel,
    customerName, setCustomerName, customerPhone, setCustomerPhone,
    roomNumber, setRoomNumber, notes, setNotes,
    menuItems, addMenuItem, updateMenuItem, removeMenuItem, menuReadyTime, setMenuReadyTime,
    openAddClientModal,
  } = w
  if (!planReady) return null

  return (
    <div>
      {/* CLIENT: search saved clients in group, or add a new one */}
      {bookingType === 'client' && (
        <div className="form-group mb-5">
          <label className="form-label">{t('guestsIn', { group: categoryMeta?.label ?? '' })}</label>

          {selectedClientId ? (
            <div className="flex items-center gap-2.5 p-[10px_12px] rounded-lg border-[1.5px] border-brand-500 bg-brand-50">
              <div className="w-[30px] h-[30px] rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-[0.8rem] shrink-0">
                {customerName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 text-sm">{customerName}</div>
                {customerPhone && <div className="text-[0.75rem] text-gray-400">{customerPhone}</div>}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={clearClient} className="inline-flex items-center gap-1">
                <X size={14} /> {t('changeGuest')}
              </Button>
            </div>
          ) : (
            <>
              <div className="relative mb-2">
                <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  className="form-input pl-[34px]"
                  placeholder={t('searchThisGroup')}
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                />
              </div>
              {clientResults.length > 0 ? (
                <div className="flex flex-col gap-1 max-h-[168px] overflow-y-auto">
                  {clientResults.map(c => (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => pickClient(c)}
                      className="flex items-center gap-2.5 text-left p-[8px_10px] rounded-lg cursor-pointer border-[1.5px] border-gray-200 bg-white shrink-0"
                    >
                      <div className="w-[30px] h-[30px] rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-[0.8rem] shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">{c.name}</div>
                        <div className="text-[0.75rem] text-gray-400 flex items-center gap-[3px]">
                          {c.roomNumber && <span className="inline-flex items-center gap-[3px]"><BedDouble size={11} />{c.roomNumber}</span>}
                          {c.phone && <span>{c.roomNumber ? ' · ' : ''}{c.phone}</span>}
                        </div>
                      </div>
                      <Check size={16} className="ml-auto text-gray-200" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[0.8rem] text-gray-400 m-0 mb-2.5">
                  {clientSearch ? t('noClientFoundName', { name: clientSearch.trim() }) : t('noSavedGuests')}
                </p>
              )}
              <Button type="button" variant="secondary" size="sm" onClick={openAddClientModal} className={`inline-flex items-center gap-1.5 ${clientResults.length > 0 ? 'mt-2' : ''}`}>
                <UserPlus size={14} /> {t('addClient')}
              </Button>
              <AddClientModal w={w} />
            </>
          )}
        </div>
      )}

      {/* ROOM: pick a room of the chosen category */}
      {bookingType === 'room' && (
        <div className="form-group mb-5">
          <label className="form-label">{t('pickARoom')} ({categoryMeta?.label})</label>
          {categoryRooms.length === 0 ? (
            <p className="text-[0.8rem] text-gray-400 m-0">
              {t('noRoomsCategory')}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categoryRooms.map(r => {
                const active = selectedRoomId === r._id
                return (
                  <button
                    key={r._id}
                    type="button"
                    onClick={() => pickRoom(r)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-[0.8125rem] cursor-pointer transition-all duration-150"
                    style={{
                      border: `1.5px solid ${active ? 'var(--brand-500)' : 'var(--gray-200)'}`,
                      background: active ? 'var(--brand-50)' : '#fff',
                      color: active ? 'var(--brand-700)' : 'var(--gray-700)',
                    }}
                  >
                    <BedDouble size={14} /> {roomLabel(r)}
                    <span className="text-[0.7rem] text-gray-400 font-normal">· {t('floorShort')} {r.floor}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Optional guest details — required for "client", optional for "room" */}
      {bookingType === 'room' && (
        <label className="form-label block mb-1">{t('guestDetailsOptional')}</label>
      )}
      {bookingType !== 'client' && (
        <div className={`grid gap-4 mb-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <div className="form-group">
            <label className="form-label">{t('guestName')}</label>
            <input
              type="text" className="form-input" placeholder={t('fullNamePlaceholder')}
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('phone')}</label>
            <input
              type="tel" className="form-input" placeholder="+998 90 123 4567"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Room number field for the client type (room type already picks a specific room above) */}
      {bookingType !== 'room' && (
        <div className="form-group mb-4">
          <label className="form-label">{t('roomNumberField')}</label>
          <input
            className="form-input" placeholder={t('roomNumberPlaceholder')}
            value={roomNumber}
            onChange={e => setRoomNumber(e.target.value)}
          />
        </div>
      )}

      <div className="form-group mb-4">
        <label className="form-label">{t('notesOptional')}</label>
        <textarea
          className="form-textarea" placeholder={t('specialRequirements')}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      {/* Optional food/order request — e.g. for a SPA & Pool event. */}
      <MenuItemsEditor
        items={menuItems}
        onAdd={addMenuItem}
        onUpdate={updateMenuItem}
        onRemove={removeMenuItem}
        readyTime={menuReadyTime}
        onReadyTimeChange={setMenuReadyTime}
      />
    </div>
  )
}
