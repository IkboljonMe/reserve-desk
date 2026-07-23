"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  SlidersHorizontal,
} from "lucide-react";
// import Dropdown from "@/components/ui/Dropdown";
import Button from "@/components/ui/Button";
import Calendar from "@/components/ui/Calendar";
import Modal from "@/components/ui/Modal";
import { useTranslation } from "@/i18n";
import { dateLocale } from "@/lib/dateLocale";
// import { money } from "@/lib/bookingHelpers";
import { useIsMobile } from "@/hooks/useIsMobile";
import { CalendarFilterModal } from "./CalendarFilterModal";
// import type { ViewMode, Density } from "../constants";
import type { CalendarPageState } from "../useCalendarPage";

export function CalendarToolbar({ s }: { s: CalendarPageState }) {
  const { t, lang } = useTranslation();
  const locale = dateLocale(lang);
  const isMobile = useIsMobile();
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const {
    navigate,
    setCurrentDate,
    headerLabel,
    // view,
    // setView,
    // density,
    // setDensity,
    goToCreate,
    currentDate,
  } = s;

  const navGroup = (
    <div
      className={`flex items-center gap-1 ${isMobile ? "justify-center pb-0" : "pb-0.5"}`}
    >
      <button
        className="cal-icon-btn"
        onClick={() => navigate(-1)}
        aria-label={t("previous")}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        className="cal-pill min-w-13 justify-center"
        onClick={() => setCurrentDate(new Date())}
      >
        {t("today")}
      </button>
      <button
        className="cal-icon-btn"
        onClick={() => navigate(1)}
        aria-label={t("next")}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );

  // const viewDropdown = (
  //   <Dropdown
  //     label={t("view")}
  //     value={view}
  //     onChange={(val) => setView(val as ViewMode)}
  //     options={[
  //       { value: "day", label: t("day") },
  //       { value: "week", label: t("periodWeek") },
  //       { value: "month", label: t("periodMonth") },
  //     ]}
  //   />
  // );

  // const densityDropdown = view !== "month" && (
  //   <Dropdown
  //     label={t("density")}
  //     value={density}
  //     onChange={(val) => setDensity(val as Density)}
  //     options={[
  //       { value: "Compact", label: "S" },
  //       { value: "Cozy", label: "M" },
  //       { value: "Roomy", label: "L" },
  //     ]}
  //   />
  // );

  const newBookingBtn = (
    <Button
      variant="primary"
      size="md"
      leftIcon={<Plus size={14} strokeWidth={2.5} />}
      className={isMobile ? "w-full justify-center" : undefined}
      onClick={() => goToCreate(format(currentDate, "yyyy-MM-dd"))}
    >
      {t("newBooking")}
    </Button>
  );

  const filterBtn = (
    <Button
      variant="secondary"
      size="md"
      leftIcon={<SlidersHorizontal size={15} />}
      onClick={() => setFilterOpen(true)}
    >
      {t("filters")}
    </Button>
  );

  const modals = (
    <>
      <CalendarFilterModal
        s={s}
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
      />
      <Modal
        open={dateOpen}
        onClose={() => setDateOpen(false)}
        title={t("selectDate")}
        size="sm"
        closeLabel={t("close")}
        bodyClassName="p-4 flex items-start justify-center"
      >
        <Calendar
          mode="single"
          locale={locale}
          value={currentDate}
          onChange={(d) => {
            setCurrentDate(d);
            setDateOpen(false);
          }}
        />
      </Modal>
    </>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col gap-2.5 mb-3.5">
        {/* Dates */}
        <span className="font-bold text-(--gray-800) text-[1.0625rem] tracking-tight text-center">
          {headerLabel}
        </span>
        {/* Date nav (prev · today · next · pick-a-date) and Filters in one row */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              className="cal-icon-btn"
              onClick={() => navigate(-1)}
              aria-label={t("previous")}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="cal-pill min-w-13 justify-center"
              onClick={() => setCurrentDate(new Date())}
            >
              {t("today")}
            </button>
            <button
              className="cal-icon-btn"
              onClick={() => navigate(1)}
              aria-label={t("next")}
            >
              <ChevronRight size={16} />
            </button>
            <button
              className="cal-icon-btn"
              onClick={() => setDateOpen(true)}
              aria-label={t("selectDate")}
            >
              <CalendarIcon size={16} />
            </button>
          </div>
          {filterBtn}
        </div>
        {modals}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full mb-3 gap-4">
      {/* Left: Navigation and Date */}
      <div className="flex items-center gap-3">
        {navGroup}
        <span className="font-bold text-(--gray-800) text-[1.0625rem] tracking-tight">
          {headerLabel}
        </span>
        <button
          className="cal-icon-btn"
          onClick={() => setDateOpen(true)}
          aria-label={t("selectDate")}
        >
          <CalendarIcon size={16} />
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {filterBtn}
        {newBookingBtn}
      </div>

      {modals}
    </div>
  );
}
