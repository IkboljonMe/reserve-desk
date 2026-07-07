'use client'

import React, { useRef, useMemo, useEffect } from 'react'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { Check } from 'lucide-react'
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
  const GUTTER = 58

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
      <div
        style={{
          display: 'flex',
          paddingLeft: GUTTER,
          position: 'sticky',
          top: 0,
          zIndex: 6,
          background: 'var(--surface-card)',
          borderBottom: '1px solid var(--gray-200)',
        }}
      >
        {days.map(day => {
          const isToday = isSameDay(day, today)
          const isWeekend = [0, 6].includes(day.getDay())
          const clickable = !!onDayHeaderClick
          return (
            <div
              key={day.toISOString()}
              onClick={clickable ? () => onDayHeaderClick!(day) : undefined}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '9px 4px 8px',
                borderLeft: '1px solid var(--gray-100)',
                cursor: clickable ? 'pointer' : 'default',
                background: isToday ? 'var(--brand-50)' : 'transparent',
                borderBottom: isToday ? '2px solid var(--brand-500)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              <div
                style={{
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 700,
                  color: isToday ? 'var(--brand-600)' : isWeekend ? 'var(--gray-300)' : 'var(--gray-400)',
                }}
              >
                {format(day, 'EEE')}
              </div>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  margin: '3px auto 0',
                  background: isToday ? 'var(--brand-500)' : 'transparent',
                  boxShadow: isToday ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9375rem',
                  fontWeight: isToday ? 700 : 600,
                  color: isToday ? '#fff' : isWeekend ? 'var(--gray-400)' : 'var(--gray-700)',
                }}
              >
                {format(day, 'd')}
              </div>
            </div>
          )
        })}
      </div>

      {/* Body */}
      <div ref={bodyRef} style={{ position: 'relative', height: bodyHeight }}>
        {/* Hour lines + gutter labels */}
        {hours.map(h => {
          const top = (h * 60 - startMin) * ppm
          return (
            <div key={h}>
              <div style={{ position: 'absolute', top, left: GUTTER, right: 0, borderTop: '1px solid var(--gray-100)' }} />
              <div
                style={{
                  position: 'absolute',
                  top,
                  left: 0,
                  width: GUTTER - 10,
                  textAlign: 'right',
                  transform: 'translateY(-50%)',
                  fontSize: '0.68rem',
                  color: 'var(--gray-400)',
                  fontVariantNumeric: 'tabular-nums',
                  background: 'var(--surface-card)',
                  paddingRight: 2,
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
            style={{
              position: 'absolute',
              top: (h * 60 + 30 - startMin) * ppm,
              left: GUTTER,
              right: 0,
              borderTop: '1px dashed var(--gray-100)',
              opacity: 0.5,
            }}
          />
        ))}

        {/* Day columns */}
        <div style={{ position: 'absolute', left: GUTTER, right: 0, top: 0, bottom: 0, display: 'flex' }}>
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const placed = packDay(bookingsForDay(dateStr))
            const isToday = isSameDay(day, today)
            const isWeekend = [0, 6].includes(day.getDay())
            return (
              <div
                key={day.toISOString()}
                onClick={e => handleColumnClick(e, day)}
                style={{
                  flex: 1,
                  position: 'relative',
                  borderLeft: '1px solid var(--gray-100)',
                  cursor: 'pointer',
                  background: isToday ? 'rgba(99,102,241,0.055)' : isWeekend ? 'rgba(148,163,184,0.04)' : 'transparent',
                }}
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
                  <div style={{ position: 'absolute', top: (nowMin - startMin) * ppm, left: 0, right: 0, zIndex: 9, pointerEvents: 'none' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: -5,
                        top: -5,
                        width: 11,
                        height: 11,
                        borderRadius: '50%',
                        background: 'var(--brand-500)',
                        border: '2px solid #fff',
                        boxShadow: '0 0 0 1px var(--brand-500)',
                      }}
                    />
                    <div style={{ borderTop: '2px solid var(--brand-500)', boxShadow: '0 0 6px rgba(99,102,241,0.35)' }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Current-time label in the gutter */}
        {todayInRange && nowVisible && (
          <div
            style={{
              position: 'absolute',
              top: (nowMin - startMin) * ppm,
              left: 0,
              width: GUTTER - 6,
              transform: 'translateY(-50%)',
              zIndex: 10,
              pointerEvents: 'none',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <span
              style={{
                background: 'var(--brand-500)',
                color: '#fff',
                fontSize: '0.66rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 6,
                fontVariantNumeric: 'tabular-nums',
                boxShadow: '0 2px 6px rgba(99,102,241,0.4)',
                letterSpacing: '0.01em',
              }}
            >
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
  const { b } = placed
  const color = b.serviceId?.color || '#6366f1'
  const top = (placed.start - startMin) * ppm
  const height = Math.max((placed.end - placed.start) * ppm, 20)
  const widthPct = 100 / placed.cols
  const state = bookingState(b)
  const finished = b.finished
  const unpaid = state.key === 'unpaid'
  const label = b.roomNumber ? `🏨 ${b.roomNumber}` : b.customerName

  return (
    <div
      className="cal-event"
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
        borderLeft: `3px solid ${finished ? '#10b981' : color}`,
        padding: height > 34 ? '3px 6px' : '1px 6px',
      }}
    >
      <span style={{ position: 'absolute', top: 3, right: 3, zIndex: 2 }}>
        {finished ? (
          <span
            title="Completed"
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#10b981',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={11} strokeWidth={3} />
          </span>
        ) : canFinish(b) ? (
          <button
            title="Mark as finished"
            aria-label="Mark as finished"
            onClick={e => {
              e.stopPropagation()
              onFinish(b)
            }}
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              padding: 0,
              cursor: 'pointer',
              background: '#fff',
              border: '1.5px solid #10b981',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all .12s',
            }}
            onMouseEnter={e => {
              const t = e.currentTarget
              t.style.background = '#10b981'
              t.style.color = '#fff'
            }}
            onMouseLeave={e => {
              const t = e.currentTarget
              t.style.background = '#fff'
              t.style.color = '#10b981'
            }}
          >
            <Check size={11} strokeWidth={3} />
          </button>
        ) : (
          <span
            title="Unpaid"
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: '#f59e0b',
              display: 'block',
              boxShadow: '0 0 0 2px #fff',
            }}
          />
        )}
      </span>

      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: 'var(--gray-800)',
          paddingRight: 16,
          lineHeight: 1.15,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
      {height > 30 && (
        <div
          style={{
            fontSize: '0.64rem',
            color: 'var(--gray-600)',
            lineHeight: 1.2,
            fontVariantNumeric: 'tabular-nums',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {b.startTime}–{b.endTime}
        </div>
      )}
      {height > 52 && b.roomNumber && (
        <div
          style={{
            fontSize: '0.64rem',
            color: 'var(--gray-500)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {b.customerName}
        </div>
      )}
      {height > 68 && (
        <div
          style={{
            fontSize: '0.62rem',
            color,
            fontWeight: 600,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            marginTop: 1,
          }}
        >
          {b.serviceId?.name}
        </div>
      )}
    </div>
  )
}
