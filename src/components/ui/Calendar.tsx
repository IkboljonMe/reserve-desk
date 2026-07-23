"use client";

import React, { useState } from "react";
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
} from "date-fns";
import type { Locale } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CalendarRange {
  from: Date | null;
  to: Date | null;
}

export interface CalendarProps {
  mode?: "single" | "range";
  value?: Date | null;
  onChange?: (date: Date) => void;
  range?: CalendarRange;
  onRangeChange?: (range: CalendarRange) => void;
  weekStartsOn?: 0 | 1;
  minDate?: Date;
  maxDate?: Date;
  locale?: Locale;
}

export default function Calendar({
  mode = "single",
  value = null,
  onChange,
  range,
  onRangeChange,
  weekStartsOn = 1,
  minDate,
  maxDate,
  locale,
}: CalendarProps) {
  const from = range?.from ?? null;
  const to = range?.to ?? null;
  const [viewMonth, setViewMonth] = useState<Date>(
    startOfMonth((mode === "range" ? from : value) ?? new Date()),
  );

  const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn });
  const gridEnd = endOfWeek(endOfMonth(viewMonth), { weekStartsOn });

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  const weekdayLabels: Date[] = [];
  for (let i = 0; i < 7; i++) weekdayLabels.push(addDays(gridStart, i));

  function isDisabled(d: Date) {
    if (minDate && isBefore(d, minDate)) return true;
    if (maxDate && isAfter(d, maxDate)) return true;
    return false;
  }

  function handleDayClick(d: Date) {
    if (isDisabled(d)) return;
    if (mode === "single") {
      onChange?.(d);
      return;
    }
    if (!onRangeChange) return;
    if (!from || (from && to)) {
      onRangeChange({ from: d, to: null });
    } else {
      onRangeChange(
        isBefore(d, from) ? { from: d, to: from } : { from, to: d },
      );
    }
  }

  function isInRange(d: Date) {
    if (mode !== "range" || !from) return false;
    const end = to ?? from;
    return !isBefore(d, from) && !isAfter(d, end);
  }

  return (
    <div className="w-66 font-[inherit] box-border">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          className="inline-flex items-center justify-center w-6.5 h-6.5 rounded-md bg-transparent text-(--gray-500,#6b7280) cursor-pointer transition-all duration-150 ease-in-out hover:bg-(--gray-100,#f3f4f6) hover:text-(--gray-800,#1f2937)"
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-[0.8125rem] font-semibold text-(--gray-800,#1f2937) capitalize">
          {format(viewMonth, "LLLL yyyy", { locale })}
        </span>
        <button
          type="button"
          className="inline-flex items-center justify-center w-6.5 h-6.5 rounded-md bg-transparent text-(--gray-500,#6b7280) cursor-pointer transition-all duration-150 ease-in-out hover:bg-(--gray-100,#f3f4f6) hover:text-(--gray-800,#1f2937)"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-0.5">
        {weekdayLabels.map((d) => (
          <span
            key={d.toISOString()}
            className="flex items-center justify-center h-6.5 text-[0.6875rem] font-semibold text-(--gray-400,#9ca3af) uppercase"
          >
            {format(d, "EEEEE", { locale })}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {days.map((d) => {
          const outside = !isSameMonth(d, viewMonth);
          const selected =
            mode === "single"
              ? Boolean(value && isSameDay(d, value))
              : Boolean(
                  (from && isSameDay(d, from)) || (to && isSameDay(d, to)),
                );
          const within = isInRange(d) && !selected;
          const disabled = isDisabled(d);
          
          let dayClasses = "flex items-center justify-center h-7.5 rounded-[7px] text-[0.78rem] font-medium transition-all duration-150 ease-in-out font-[inherit]";
          
          if (disabled) {
            dayClasses += " text-(--gray-200,#e5e7eb) cursor-not-allowed bg-transparent";
          } else if (selected) {
            dayClasses += " bg-(--brand-500,#6366f1) text-white font-semibold cursor-pointer";
          } else if (within) {
            dayClasses += " bg-(--brand-50,#e0e7ff) !rounded-none text-(--gray-700,#374151) cursor-pointer hover:bg-(--gray-100,#f3f4f6)";
          } else {
            dayClasses += " bg-transparent cursor-pointer hover:bg-(--gray-100,#f3f4f6)";
            if (outside) {
              dayClasses += " text-(--gray-300,#d1d5db)";
            } else {
              dayClasses += " text-(--gray-700,#374151)";
            }
          }

          return (
            <button
              key={d.toISOString()}
              type="button"
              disabled={disabled}
              className={dayClasses}
              onClick={() => handleDayClick(d)}
            >
              {format(d, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
