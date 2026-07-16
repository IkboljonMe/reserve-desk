'use client'

import { format, parseISO } from 'date-fns'
import { X, Check, Clock, MapPin, Phone, User, Trash2, CalendarDays, Wallet, FileText, Pencil, UtensilsCrossed } from 'lucide-react'
import { getServiceIcon } from '@/lib/serviceIcons'
import { bookingState, money, amountCollected, isPartiallyPaid } from '@/lib/bookingHelpers'
import { Badge } from '@/components/ui/Badge'
import { useTranslation } from '@/i18n'
import { DetailRow } from './DetailRow'
import type { CalendarPageState } from '../useCalendarPage'
import Button from '@/components/ui/Button'

export function BookingDetailModal({ s }: { s: CalendarPageState }) {
  const { t } = useTranslation()
  const { selectedBooking, setSelectedBooking, deleteConfirm, setDeleteConfirm, setPayConfirm, setEditBooking, markFinished, handleDeleteBooking } = s
  if (!selectedBooking) return null

  const close = () => { setSelectedBooking(null); setDeleteConfirm(null) }

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal max-w-[440px]" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('bookingDetails')}</h2>
          <Button variant="ghost" icon onClick={close} aria-label={t('close')}><X size={18} /></Button>
        </div>

        <div className="flex flex-col gap-3.5 text-sm">
          <div
            className="flex items-center gap-2.5 p-3 rounded-lg border"
            style={{
              background: `${selectedBooking.serviceId?.color || '#6366f1'}12`,
              borderColor: `${selectedBooking.serviceId?.color || '#6366f1'}33`,
            }}
          >
            <span
              className="w-[34px] h-[34px] rounded-lg shrink-0 flex items-center justify-center"
              style={{
                background: `${selectedBooking.serviceId?.color || '#6366f1'}22`,
                color: selectedBooking.serviceId?.color || '#6366f1',
              }}
            >
              {getServiceIcon(selectedBooking.serviceId?.name || '')}
            </span>
            <strong className="text-[var(--gray-800)] text-[0.95rem] font-bold">{selectedBooking.serviceId?.name}</strong>
            {(() => {
              const st = bookingState(selectedBooking)
              return (
                <Badge variant={st.badge} className="ml-auto">
                  {st.key === 'finished' && <Check size={12} />}
                  {t(st.key)}
                </Badge>
              )
            })()}
          </div>

          <DetailRow icon={<User size={15} />} label={t('guest')} value={selectedBooking.customerName} />
          {selectedBooking.roomNumber && <DetailRow icon={<MapPin size={15} />} label={t('room')} value={selectedBooking.roomNumber} accent />}
          {selectedBooking.customerPhone && <DetailRow icon={<Phone size={15} />} label={t('phone')} value={selectedBooking.customerPhone} />}
          <DetailRow icon={<CalendarDays size={15} />} label={t('date')} value={format(parseISO(selectedBooking.date), 'EEEE, MMM d, yyyy')} />
          <DetailRow icon={<Clock size={15} />} label={t('time')} value={`${selectedBooking.startTime} – ${selectedBooking.endTime}`} />
          {selectedBooking.totalPrice > 0 && (
            <DetailRow icon={<span className="font-bold text-[11px]">{t('sum')}</span>} label={t('price')} value={`${money(selectedBooking.totalPrice)} ${t('sum')}`} success />
          )}
          <DetailRow
            icon={<Wallet size={15} />}
            label={t('payment')}
            value={
              selectedBooking.totalPrice === 0
                ? t('freeNoCharge')
                : selectedBooking.paid
                  ? t('paid')
                  : isPartiallyPaid(selectedBooking)
                    ? `${money(amountCollected(selectedBooking))} / ${money(selectedBooking.totalPrice)} ${t('sum')}`
                    : t('unpaid')
            }
            accent={!selectedBooking.paid && selectedBooking.totalPrice > 0}
            success={selectedBooking.paid}
          />
          {selectedBooking.notes && <DetailRow icon={<FileText size={15} />} label={t('notes')} value={selectedBooking.notes} />}
          {selectedBooking.menuItems && selectedBooking.menuItems.length > 0 && (
            <DetailRow
              icon={<UtensilsCrossed size={15} />}
              label={t('menu')}
              value={
                selectedBooking.menuItems.map(it => `${it.qty}x ${it.name}`).join(', ') +
                (selectedBooking.menuReadyTime ? ` · ${t('menuReadyTime')} ${selectedBooking.menuReadyTime}` : '')
              }
            />
          )}
        </div>

        <div className="h-px bg-surface-border my-4" />

        {/* Lifecycle actions */}
        {selectedBooking.finished ? (
          <div className="flex items-center justify-center gap-2 p-2.5 mb-3.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-[0.85rem]">
            <Check size={16} /> {t('completed')}
          </div>
        ) : (bookingState(selectedBooking).key === 'unpaid' || bookingState(selectedBooking).key === 'partial') ? (
          <Button className="w-full mb-3.5" onClick={() => setPayConfirm(selectedBooking)}>
            <Wallet size={15} /> {isPartiallyPaid(selectedBooking) ? t('collectBalance') : t('markAsPaid')}
          </Button>
        ) : (
          <Button
            className="w-full mb-3.5 bg-emerald-500 hover:bg-emerald-600 text-white border-none"
            onClick={() => markFinished(selectedBooking)}
          >
            <Check size={16} strokeWidth={2.5} /> {t('markAsFinished')}
          </Button>
        )}

        <div className="flex justify-between items-center">
          {deleteConfirm === selectedBooking._id ? (
            <div className="flex gap-2 items-center">
              <span className="text-[0.8125rem] text-[var(--danger)]">{t('deleteThisBooking')}</span>
              <Button variant="danger" size="sm" onClick={() => handleDeleteBooking(selectedBooking._id)}>{t('delete')}</Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>{t('cancel')}</Button>
            </div>
          ) : (
            <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(selectedBooking._id)}>
              <Trash2 size={13} /> {t('delete')}
            </Button>
          )}
          <div className="flex gap-2">
            {!selectedBooking.finished && (
              <Button variant="secondary" size="sm" onClick={() => { setEditBooking(selectedBooking); setSelectedBooking(null) }}>
                <Pencil size={13} /> {t('edit')}
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={close}>{t('close')}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
