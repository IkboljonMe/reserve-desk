'use client'

import React, { useRef, useMemo, useEffect } from 'react'
import { format, isSameDay } from 'date-fns'
import { Check, Lock } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { dateLocale } from '@/lib/dateLocale'
import {
  Booking,
  toMin,
  fromMin,
  bookingState,
  canFinish,
} from '@/lib/bookingHelpers'

interface Placed {
  b: Booking
  start: number
  end: number
  col: number
  cols: number
}

// Pack overlapping events into side-by-side columns per day.
function packDay(events: Booking[]): Placed[] {
  const items = events
    .map(b => ({ b, start: toMin(b.startTime), end: Math.max(toMin(b.endTime), toMin(b.startTime) + 15) }))
    .sort((a, b) => a.start - b.start || a.end - b.end)

  const out: Placed[] = []
  let cluster: Placed[] = []
  let active: { end: number; col: number }[] = []
  let clusterEnd = -1

  const flush = () => {
    const cols = cluster.reduce((m, x) => Math.max(m, x.col), 0) + 1
    cluster.forEach(x => (x.cols = cols))
    out.push(...cluster)
    cluster = []
    active = []
  }

  for (const it of items) {
    if (cluster.length && it.start >= clusterEnd) flush()
    const overlapping = active.filter(a => a.end > it.start)
    const used = new Set(overlapping.map(a => a.col))
    let col = 0
    while (used.has(col)) col++
    const placed: Placed = { b: it.b, start: it.start, end: it.end, col, cols: 1 }
    cluster.push(placed)
    active.push({ end: it.end, col })
    clusterEnd = Math.max(clusterEnd, it.end)
  }
  if (cluster.length) flush()
  return out
}

interface TimeGridProps {
  days: Date[]
  today: Date
  rowH: number
  bookingsForDay: (d: string) => Booking[]
  onCreate: (dateStr: string, time: string) => void
  onBookingClick: (b: Booking) => void
  onFinish: (b: Booking) => void
  onDayHeaderClick?: (d: Date) => void
}

export default function TimeGrid({
  days,
  today,
  rowH,
  bookingsForDay,
  onCreate,
  onBookingClick,
  onFinish,
  onDayHeaderClick,
}: TimeGridProps) {
  const { lang } = useTranslation()
  const locale = dateLocale(lang)
  const bodyRef = useRef<HTMLDivElement>(null)
  const ppm = rowH / 60

  // Dynamic visible range: default 07:00–22:00, expanded to fit any booking.
  const { startHour, endHour } = useMemo(() => {
    let minM = 7 * 60, maxM = 22 * 60
    for (const day of days) {
      for (const b of bookingsForDay(format(day, 'yyyy-MM-dd'))) {
        minM = Math.min(minM, toMin(b.startTime))
        maxM = Math.max(maxM, toMin(b.endTime))
      }
    }
    return { startHour: Math.max(0, Math.floor(minM / 60)), endHour: Math.min(24, Math.ceil(maxM / 60)) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, bookingsForDay, rowH])

  const startMin = startHour * 60
  const totalMin = (endHour - startHour) * 60
  const bodyHeight = totalMin * ppm
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)

  const nowMin = today.getHours() * 60 + today.getMinutes()
  const nowVisible = nowMin >= startMin && nowMin <= endHour * 60
  const todayInRange = days.some(d => isSameDay(d, today))

  // On mount, scroll to the current time (centered) when today is in view,
  // otherwise to a sensible business-hours start.
  useEffect(() => {
    const scroller = bodyRef.current?.parentElement
    if (!scroller) return
    const anchorMin = todayInRange && nowVisible ? nowMin : 8 * 60
    const target = Math.max(0, (anchorMin - startMin) * ppm - scroller.clientHeight / 2 + 40)
    scroller.scrollTo({ top: target })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleColumnClick = (e: React.MouseEvent<HTMLDivElement>, day: Date) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    let minute = startMin + Math.round((y / ppm) / 15) * 15
    minute = Math.max(startMin, Math.min(endHour * 60 - 15, minute))
    onCreate(format(day, 'yyyy-MM-dd'), fromMin(minute))
  }

  return (
    <div style={{ minWidth: days.length > 1 ? 640 : undefined }}>
      {/* Sticky header */}
      <div className="flex pl-[58px] sticky top-0 z-[6] bg-[var(--surface-card)] border-b border-[var(--gray-200)]">
        {days.map(day => {
          const isToday = isSameDay(day, today)
          const isWeekend = [0, 6].includes(day.getDay())
          const clickable = !!onDayHeaderClick
          return (
            <div
              key={day.toISOString()}
              onClick={clickable ? () => onDayHeaderClick!(day) : undefined}
              className={`flex-1 text-center p-[9px_4px_8px] border-l border-[var(--gray-100)] ${
                clickable ? 'cursor-pointer' : 'cursor-default'
              } ${
                isToday ? 'bg-[var(--brand-50)] border-b-2 border-b-[var(--brand-500)]' : 'bg-transparent border-b-2 border-b-transparent -mb-[1px]'
              }`}
            >
              <div
                className={`text-[0.68rem] uppercase tracking-wider font-bold ${
                  isToday ? 'text-[var(--brand-600)]' : isWeekend ? 'text-[var(--gray-300)]' : 'text-[var(--gray-400)]'
                }`}
              >
                {format(day, 'EEE', { locale })}
              </div>
              <div
                className={`w-[30px] h-[30px] rounded-full mx-auto mt-0.75 flex items-center justify-center text-[0.9375rem] ${
                  isToday ? 'bg-[var(--brand-500)] text-white shadow-[0_2px_8px_rgba(99,102,241,0.4)] font-bold' : isWeekend ? 'text-[var(--gray-400)] font-semibold' : 'text-[var(--gray-700)] font-semibold'
                }`}
              >
                {format(day, 'd')}
              </div>
            </div>
          )
        })}
      </div>

      {/* Body */}
      <div ref={bodyRef} className="relative" style={{ height: bodyHeight }}>
        {/* Hour lines + gutter labels */}
        {hours.map(h => {
          const top = (h * 60 - startMin) * ppm
          return (
            <div key={h}>
              <div className="absolute left-[58px] right-0 border-t border-[var(--gray-100)]" style={{ top }} />
              <div
                className="absolute left-0 w-[48px] text-right -translate-y-1/2 text-[0.68rem] text-[var(--gray-400)] tabular-nums bg-[var(--surface-card)] pr-0.5"
                style={{
                  top,
                }}
              >
                {h < 24 ? `${h.toString().padStart(2, '0')}:00` : ''}
              </div>
            </div>
          )
        })}
        {/* Half-hour faint lines */}
        {hours.slice(0, -1).map(h => (
          <div
            key={`half-${h}`}
            className="absolute left-[58px] right-0 border-t border-dashed border-[var(--gray-100)] opacity-50"
            style={{
              top: (h * 60 + 30 - startMin) * ppm,
            }}
          />
        ))}

        {/* Day columns */}
        <div className="absolute left-[58px] right-0 top-0 bottom-0 flex">
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const placed = packDay(bookingsForDay(dateStr))
            const isToday = isSameDay(day, today)
            const isWeekend = [0, 6].includes(day.getDay())
            return (
              <div
                key={day.toISOString()}
                onClick={e => handleColumnClick(e, day)}
                className={`flex-1 relative border-l border-[var(--gray-100)] cursor-pointer ${
                  isToday ? 'bg-[rgba(99,102,241,0.055)]' : isWeekend ? 'bg-[rgba(148,163,184,0.04)]' : 'bg-transparent'
                }`}
              >
                {placed.map(p => (
                  <EventBlock
                    key={p.b._id}
                    placed={p}
                    startMin={startMin}
                    ppm={ppm}
                    onClick={onBookingClick}
                    onFinish={onFinish}
                  />
                ))}
                {isToday && nowVisible && (
                  <div className="absolute left-0 right-0 z-[9] pointer-events-none" style={{ top: (nowMin - startMin) * ppm }}>
                    <div className="absolute -left-[5px] -top-[5px] w-[11px] h-[11px] rounded-full bg-[var(--brand-500)] border-2 border-white shadow-[0_0_0_1px_var(--brand-500)]" />
                    <div className="border-t-2 border-t-[var(--brand-500)] shadow-[0_0_6px_rgba(99,102,241,0.35)]" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Current-time label in the gutter */}
        {todayInRange && nowVisible && (
          <div
            className="absolute left-0 w-[52px] -translate-y-1/2 z-10 pointer-events-none flex justify-end"
            style={{
              top: (nowMin - startMin) * ppm,
            }}
          >
            <span className="bg-[var(--brand-500)] text-white text-[0.66rem] font-bold p-[1px_6px] rounded-md tabular-nums shadow-[0_2px_6px_rgba(99,102,241,0.4)] tracking-wide">
              {fromMin(nowMin)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function EventBlock({
  placed,
  startMin,
  ppm,
  onClick,
  onFinish,
}: {
  placed: Placed
  startMin: number
  ppm: number
  onClick: (b: Booking) => void
  onFinish: (b: Booking) => void
}) {
  const { t } = useTranslation()
  const { b } = placed
  const color = b.serviceId?.color || '#6366f1'
  const top = (placed.start - startMin) * ppm
  const height = Math.max((placed.end - placed.start) * ppm, 20)
  const widthPct = 100 / placed.cols

  // A booking on a shared service made by another hotel: show it as an occupied
  // block so this hotel can't double-book, but reveal none of its guest data.
  if (b.masked) {
    return (
      <div
        className={`absolute rounded-[7px] overflow-hidden transition-all duration-120 box-border border border-[var(--gray-300)] border-l-[3px] border-l-[var(--gray-400)] cursor-default text-[var(--gray-500)] ${
          height > 34 ? 'p-[3px_6px]' : 'p-[1px_6px]'
        }`}
        title={`${b.startTime}–${b.endTime} · ${t('occupied')}`}
        style={{
          top,
          height,
          left: `calc(${placed.col * widthPct}% + 2px)`,
          width: `calc(${widthPct}% - 4px)`,
          background: 'repeating-linear-gradient(45deg, var(--gray-100), var(--gray-100) 6px, var(--gray-200) 6px, var(--gray-200) 12px)',
        }}
      >
        <div className="flex items-center gap-1 text-[0.7rem] font-semibold">
          <Lock size={11} /> {t('occupied')}
        </div>
        {height > 30 && (
          <div className="text-[0.64rem] tabular-nums">
            {b.startTime}–{b.endTime}
          </div>
        )}
      </div>
    )
  }

  const state = bookingState(b)
  const finished = b.finished
  const unpaid = state.key === 'unpaid'
  const label = b.roomNumber || b.customerName

  return (
    <div
      className={`absolute rounded-[7px] overflow-hidden cursor-pointer transition-all duration-120 box-border hover:shadow-[0_6px_16px_rgba(0,0,0,0.14)] hover:-translate-y-[1px] hover:z-[5] hover:saturate-[1.15] border-l-[3px] ${
        height > 34 ? 'p-[3px_6px]' : 'p-[1px_6px]'
      }`}
      title={`${b.startTime}–${b.endTime} · ${b.customerName}${b.roomNumber ? ` · Room ${b.roomNumber}` : ''} · ${
        b.serviceId?.name || ''
      } · ${state.label}`}
      onClick={e => {
        e.stopPropagation()
        onClick(b)
      }}
      style={{
        top,
        height,
        left: `calc(${placed.col * widthPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        background: finished ? `${color}18` : `${color}26`,
        border: `1px ${unpaid ? 'dashed' : 'solid'} ${color}66`,
        borderLeftColor: finished ? '#10b981' : color,
      }}
    >
      <span className="absolute top-[3px] right-[3px] z-[2]">
        {finished ? (
          <span
            title={t('completed')}
            className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center"
          >
            <Check size={11} strokeWidth={3} />
          </span>
        ) : canFinish(b) ? (
          <button
            title={t('markFinishedTitle')}
            aria-label={t('markFinishedTitle')}
            onClick={e => {
              e.stopPropagation()
              onFinish(b)
            }}
            className="w-4 h-4 rounded-full p-0 cursor-pointer bg-white border border-emerald-500 text-emerald-500 flex items-center justify-center transition-all duration-120 hover:bg-emerald-500 hover:text-white"
          >
            <Check size={11} strokeWidth={3} />
          </button>
        ) : (
          <span
            title={t('unpaid')}
            className="w-2.25 h-2.25 rounded-full bg-amber-500 block shadow-[0_0_0_2px_#fff]"
          />
        )}
      </span>

      <div
        className="text-[0.7rem] font-bold text-[var(--gray-800)] pr-4 leading-[1.15] overflow-hidden text-ellipsis whitespace-nowrap"
      >
        {label}
      </div>
      {height > 30 && (
        <div
          className="text-[0.64rem] text-[var(--gray-600)] leading-[1.2] tabular-nums overflow-hidden whitespace-nowrap text-ellipsis"
        >
          {b.startTime}–{b.endTime}
        </div>
      )}
      {height > 52 && b.roomNumber && (
        <div
          className="text-[0.64rem] text-[var(--gray-500)] overflow-hidden whitespace-nowrap text-ellipsis"
        >
          {b.customerName}
        </div>
      )}
      {height > 68 && (
        <div
          className="text-[0.62rem] font-semibold overflow-hidden whitespace-nowrap text-ellipsis mt-[1px]"
          style={{ color }}
        >
          {b.serviceId?.name}
        </div>
      )}
    </div>
  )
}
