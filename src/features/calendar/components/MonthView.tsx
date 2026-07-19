'use client'

import React from 'react'
import { format, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns'
import { Check, Lock } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { Booking, toMin, canFinish } from '@/lib/bookingHelpers'

interface MonthViewProps {
  currentDate: Date
  today: Date
  bookingsForDay: (d: string) => Booking[]
  onDayClick: (d: Date) => void
  onBookingClick: (b: Booking) => void
  onFinish: (b: Booking) => void
}

export default function MonthView({
  currentDate,
  today,
  bookingsForDay,
  onDayClick,
  onBookingClick,
  onFinish,
}: MonthViewProps) {
  const { t } = useTranslation()
  const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
  const end = addDays(startOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }), 6)
  const days = eachDayOfInterval({ start, end })
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Helper inside component to avoid global reference to end
  function addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }

  return (
    <div className="p-3.5">
      <div className="grid grid-cols-7 gap-0.75 mb-1">
        {dayNames.map(d => (
          <div
            key={d}
            className="text-center text-[0.7rem] font-bold text-[var(--gray-400)] py-1 uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const list = bookingsForDay(dateStr)
            .filter(b => b.status !== 'cancelled')
            .sort((a, b) => toMin(a.startTime) - toMin(b.startTime))
          const isToday = isSameDay(day, today)
          const inMonth = isSameMonth(day, currentDate)
            const todayMidnight = new Date(today)
            todayMidnight.setHours(0, 0, 0, 0)
            const isPastDay = day < todayMidnight

            return (
              <div
                key={dateStr}
                onClick={() => {
                  if (!isPastDay) onDayClick(day)
                }}
                className={`min-h-[104px] p-1.5 transition-all duration-120 flex flex-col gap-0.75 border ${
                  isPastDay ? 'bg-[var(--gray-50)] border-[var(--gray-200)] opacity-60 cursor-not-allowed' :
                  `cursor-pointer hover:shadow-sm hover:border-[var(--brand-400)] ${
                    isToday ? 'bg-[var(--brand-50)] border-[var(--brand-400)]' : inMonth ? 'bg-[var(--surface-card)] border-[var(--gray-200)]' : 'bg-[var(--gray-50)] border-[var(--gray-200)]'
                  }`
                }`}
              >
                <div
                  className={`text-[0.75rem] w-[22px] h-[22px] flex items-center justify-center rounded-full self-start ${
                    isToday ? 'bg-[var(--brand-500)] text-white font-bold' : inMonth ? 'text-[var(--gray-700)] font-semibold' : 'text-[var(--gray-400)] font-semibold'
                  }`}
                >
                {format(day, 'd')}
              </div>
              {list.slice(0, 3).map(b => {
                const color = b.serviceId?.color || '#6366f1'
                if (b.masked) {
                  return (
                    <div
                      key={b._id}
                      title={`${b.startTime}–${b.endTime} · ${t('occupied')}`}
                      className="flex items-center gap-1.25 border-l-[3px] border-l-[var(--gray-400)] p-[2px_5px_2px_6px] text-[0.68rem] text-[var(--gray-500)] overflow-hidden whitespace-nowrap text-ellipsis cursor-default"
                      style={{
                        background: 'repeating-linear-gradient(45deg, var(--gray-100), var(--gray-100) 5px, var(--gray-200) 5px, var(--gray-200) 10px)',
                      }}
                    >
                      <span className="font-bold tabular-nums">{b.startTime}</span>
                      <span className="flex-1 flex items-center gap-0.75 overflow-hidden text-ellipsis">
                        <Lock size={10} /> {t('occupied')}
                      </span>
                    </div>
                  )
                }
                return (
                  <div
                    key={b._id}
                    onClick={e => {
                      e.stopPropagation()
                      onBookingClick(b)
                    }}
                    className="flex items-center gap-1.25 p-[2px_5px_2px_6px] text-[0.68rem] text-[var(--gray-700)] overflow-hidden whitespace-nowrap text-ellipsis border-l-[3px] cursor-pointer"
                    style={{
                      background: b.finished ? `${color}12` : `${color}1f`,
                      borderLeftColor: b.finished ? '#10b981' : color,
                    }}
                  >
                    <span className="font-bold tabular-nums" style={{ color }}>{b.startTime}</span>
                    <span className="flex-1 overflow-hidden text-ellipsis">
                      {b.roomNumber || b.customerName}
                    </span>
                    {b.finished ? (
                      <Check size={11} strokeWidth={3} className="text-emerald-500 shrink-0" />
                    ) : canFinish(b) ? (
                      <button
                        title={t('markFinishedTitle')}
                        aria-label={t('markFinishedTitle')}
                        onClick={e => {
                          e.stopPropagation()
                          onFinish(b)
                        }}
                        className="w-3.5 h-3.5 shrink-0 rounded-full p-0 cursor-pointer bg-white border border-emerald-500 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all duration-120"
                      >
                        <Check size={9} strokeWidth={3} />
                      </button>
                    ) : (
                      <span
                        title={t('unpaid')}
                        className="w-1.75 h-1.75 shrink-0 rounded-full bg-amber-500"
                      />
                    )}
                  </div>
                )
              })}
              {list.length > 3 && (
                <div className="text-[0.68rem] text-[var(--gray-400)] pl-1 font-semibold">
                  +{list.length - 3} more
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
