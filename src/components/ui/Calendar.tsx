'use client'

import React, { useState } from 'react'
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameDay,
  isSameMonth,
  isBefore,
  isAfter,
} from 'date-fns'
import type { Locale } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface CalendarRange {
  from: Date | null
  to: Date | null
}

export interface CalendarProps {
  mode?: 'single' | 'range'
  value?: Date | null
  onChange?: (date: Date) => void
  range?: CalendarRange
  onRangeChange?: (range: CalendarRange) => void
  weekStartsOn?: 0 | 1
  minDate?: Date
  maxDate?: Date
  locale?: Locale
}

export default function Calendar({
  mode = 'single',
  value = null,
  onChange,
  range,
  onRangeChange,
  weekStartsOn = 1,
  minDate,
  maxDate,
  locale,
}: CalendarProps) {
  const from = range?.from ?? null
  const to = range?.to ?? null
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth((mode === 'range' ? from : value) ?? new Date()))

  const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn })
  const gridEnd = endOfWeek(endOfMonth(viewMonth), { weekStartsOn })

  const days: Date[] = []
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d)

  const weekdayLabels: Date[] = []
  for (let i = 0; i < 7; i++) weekdayLabels.push(addDays(gridStart, i))

  function isDisabled(d: Date) {
    if (minDate && isBefore(d, minDate)) return true
    if (maxDate && isAfter(d, maxDate)) return true
    return false
  }

  function handleDayClick(d: Date) {
    if (isDisabled(d)) return
    if (mode === 'single') {
      onChange?.(d)
      return
    }
    if (!onRangeChange) return
    if (!from || (from && to)) {
      onRangeChange({ from: d, to: null })
    } else {
      onRangeChange(isBefore(d, from) ? { from: d, to: from } : { from, to: d })
    }
  }

  function isInRange(d: Date) {
    if (mode !== 'range' || !from) return false
    const end = to ?? from
    return !isBefore(d, from) && !isAfter(d, end)
  }

  return (
    <div className="rd-calendar">
      <style>{`
        .rd-calendar {
          width: 264px;
          font-family: inherit;
          box-sizing: border-box;
        }
        .rd-calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .rd-calendar-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--gray-800, #1f2937);
          text-transform: capitalize;
        }
        .rd-calendar-nav {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: var(--gray-500, #6b7280);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .rd-calendar-nav:hover {
          background: var(--gray-100, #f3f4f6);
          color: var(--gray-800, #1f2937);
        }
        .rd-calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 2px;
        }
        .rd-calendar-weekdays span {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 26px;
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--gray-400, #9ca3af);
          text-transform: uppercase;
        }
        .rd-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }
        .rd-calendar-day {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 30px;
          border: none;
          border-radius: 7px;
          background: transparent;
          font-size: 0.78rem;
          font-weight: 500;
          color: var(--gray-700, #374151);
          cursor: pointer;
          transition: all 0.12s ease;
          font-family: inherit;
        }
        .rd-calendar-day:hover:not(:disabled) {
          background: var(--gray-100, #f3f4f6);
        }
        .rd-calendar-day.outside {
          color: var(--gray-300, #d1d5db);
        }
        .rd-calendar-day.in-range {
          background: var(--brand-50, #e0e7ff);
          border-radius: 0;
        }
        .rd-calendar-day.selected {
          background: var(--brand-500, #6366f1);
          color: #fff;
          font-weight: 600;
        }
        .rd-calendar-day:disabled {
          color: var(--gray-200, #e5e7eb);
          cursor: not-allowed;
        }
      `}</style>

      <div className="rd-calendar-header">
        <button type="button" className="rd-calendar-nav" onClick={() => setViewMonth(m => subMonths(m, 1))} aria-label="Previous month">
          <ChevronLeft size={16} />
        </button>
        <span className="rd-calendar-title">{format(viewMonth, 'LLLL yyyy', { locale })}</span>
        <button type="button" className="rd-calendar-nav" onClick={() => setViewMonth(m => addMonths(m, 1))} aria-label="Next month">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="rd-calendar-weekdays">
        {weekdayLabels.map(d => (
          <span key={d.toISOString()}>{format(d, 'EEEEE', { locale })}</span>
        ))}
      </div>

      <div className="rd-calendar-grid">
        {days.map(d => {
          const outside = !isSameMonth(d, viewMonth)
          const selected = mode === 'single' ? Boolean(value && isSameDay(d, value)) : Boolean((from && isSameDay(d, from)) || (to && isSameDay(d, to)))
          const within = isInRange(d) && !selected
          const disabled = isDisabled(d)
          return (
            <button
              key={d.toISOString()}
              type="button"
              disabled={disabled}
              className={`rd-calendar-day ${outside ? 'outside' : ''} ${selected ? 'selected' : ''} ${within ? 'in-range' : ''}`.trim()}
              onClick={() => handleDayClick(d)}
            >
              {format(d, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
