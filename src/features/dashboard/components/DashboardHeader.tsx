"use client";

import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { nowUZ } from "@/lib/timezone";
import { dateLocale } from "@/lib/dateLocale";
import { useBookingModal } from "@/components/BookingModalProvider";
import { useTranslation } from "@/i18n";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import Calendar from "@/components/ui/Calendar";
import type { PeriodKey } from "../utils";
import type { DashboardPageState } from "../useDashboardPage";

export function DashboardHeader({ s }: { s: DashboardPageState }) {
  const { t, lang } = useTranslation();
  const locale = dateLocale(lang);
  const { openBookingModal } = useBookingModal();
  const {
    period,
    setPeriod,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
  } = s;
  const [pickerOpen, setPickerOpen] = useState(false);
  // Draft selection while the popover is open. Kept separate from customFrom/customTo
  // so `to` can stay genuinely null between the two picks — collapsing it into a
  // same-day value here would make the calendar think the range is already complete
  // and reset instead of accepting the second click.
  const [draftFrom, setDraftFrom] = useState<Date | null>(null);
  const [draftTo, setDraftTo] = useState<Date | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    function onDoc(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setPickerOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [pickerOpen]);

  function openPicker() {
    setDraftFrom(null);
    setDraftTo(null);
    setPickerOpen(true);
  }

  const periodOptions = (
    [
      ["week", t("periodWeek")],
      ["month", t("periodMonth")],
      ["7d", "7d"],
      ["30d", "30d"],
      ["custom", t("periodCustom")],
    ] as [PeriodKey, string][]
  ).map(([value, label]) => ({ value, label }));

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1>{t("dashboard")}</h1>
        <p className="mt-1">
          {format(nowUZ(), "EEEE, MMMM d, yyyy", { locale })}
        </p>
      </div>
      <div className="flex gap-2 items-center flex-wrap justify-end shrink-0">
        <div className="w-30 sm:w-35">
          <Dropdown
            value={period}
            onChange={(v) => {
              setPeriod(v as PeriodKey);
              if (v === "custom") openPicker();
              else setPickerOpen(false);
            }}
            options={periodOptions}
            ariaLabel={t("dashboard")}
          />
        </div>
        {period === "custom" && (
          <div ref={pickerRef} className="relative">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<CalendarIcon size={14} />}
              onClick={() => (pickerOpen ? setPickerOpen(false) : openPicker())}
            >
              {format(new Date(customFrom), "MMM d", { locale })} –{" "}
              {format(new Date(customTo), "MMM d", { locale })}
            </Button>
            {pickerOpen && (
              <div className="absolute top-[calc(100%+6px)] left-0 z-9999 bg-white border border-gray-200 p-3 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)]">
                <Calendar
                  mode="range"
                  locale={locale}
                  range={{ from: draftFrom, to: draftTo }}
                  onRangeChange={(r) => {
                    setDraftFrom(r.from);
                    setDraftTo(r.to);
                    if (r.from && r.to) {
                      setCustomFrom(format(r.from, "yyyy-MM-dd"));
                      setCustomTo(format(r.to, "yyyy-MM-dd"));
                      setPickerOpen(false);
                    }
                  }}
                  maxDate={nowUZ()}
                />
              </div>
            )}
          </div>
        )}
        {/* Hidden on mobile — the mobile top navbar carries New booking there. */}
        <div className="hidden md:block">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={14} strokeWidth={2.5} />}
            onClick={() =>
              openBookingModal({ date: format(nowUZ(), "yyyy-MM-dd") })
            }
          >
            {t("newBooking")}
          </Button>
        </div>
      </div>
    </div>
  );
}
