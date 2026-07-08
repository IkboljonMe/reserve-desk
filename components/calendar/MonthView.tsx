'use client'

import React from 'react'
import { format, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns'
import { Check, Lock } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
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
    <div style={{ padding: '0.85rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
        {dayNames.map(d => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--gray-400)',
              padding: '4px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const list = bookingsForDay(dateStr)
            .filter(b => b.status !== 'cancelled')
            .sort((a, b) => toMin(a.startTime) - toMin(b.startTime))
          const isToday = isSameDay(day, today)
          const inMonth = isSameMonth(day, currentDate)
          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(day)}
              style={{
                minHeight: 104,
                padding: 6,
                borderRadius: 10,
                background: isToday ? 'var(--brand-50)' : inMonth ? 'var(--surface-card)' : 'var(--gray-50)',
                border: `1px solid ${isToday ? 'var(--brand-400)' : 'var(--gray-200)'}`,
                cursor: 'pointer',
                transition: 'border-color .12s, box-shadow .12s',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.boxShadow = 'var(--shadow-sm)'
                el.style.borderColor = 'var(--brand-400)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.boxShadow = 'none'
                el.style.borderColor = isToday ? 'var(--brand-400)' : 'var(--gray-200)'
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: isToday ? 700 : 600,
                  width: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  alignSelf: 'flex-start',
                  background: isToday ? 'var(--brand-500)' : 'transparent',
                  color: isToday ? '#fff' : inMonth ? 'var(--gray-700)' : 'var(--gray-300)',
                }}
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
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: 'repeating-linear-gradient(45deg, var(--gray-100), var(--gray-100) 5px, var(--gray-200) 5px, var(--gray-200) 10px)',
                        borderLeft: '3px solid var(--gray-400)',
                        borderRadius: 5, padding: '2px 5px 2px 6px',
                        fontSize: '0.68rem', color: 'var(--gray-500)',
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        cursor: 'default',
                      }}
                    >
                      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{b.startTime}</span>
                      <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      background: b.finished ? `${color}12` : `${color}1f`,
                      borderLeft: `3px solid ${b.finished ? '#10b981' : color}`,
                      borderRadius: 5,
                      padding: '2px 5px 2px 6px',
                      fontSize: '0.68rem',
                      color: 'var(--gray-700)',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <span style={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{b.startTime}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {b.roomNumber ? `🏨 ${b.roomNumber}` : b.customerName}
                    </span>
                    {b.finished ? (
                      <Check size={11} strokeWidth={3} style={{ color: '#10b981', flexShrink: 0 }} />
                    ) : canFinish(b) ? (
                      <button
                        title="Mark as finished"
                        aria-label="Mark as finished"
                        onClick={e => {
                          e.stopPropagation()
                          onFinish(b)
                        }}
                        style={{
                          width: 14,
                          height: 14,
                          flexShrink: 0,
                          borderRadius: '50%',
                          padding: 0,
                          cursor: 'pointer',
                          background: '#fff',
                          border: '1.5px solid #10b981',
                          color: '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={9} strokeWidth={3} />
                      </button>
                    ) : (
                      <span
                        title="Unpaid"
                        style={{ width: 7, height: 7, flexShrink: 0, borderRadius: '50%', background: '#f59e0b' }}
                      />
                    )}
                  </div>
                )
              })}
              {list.length > 3 && (
                <div style={{ fontSize: '0.68rem', color: 'var(--gray-400)', paddingLeft: 4, fontWeight: 600 }}>
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
