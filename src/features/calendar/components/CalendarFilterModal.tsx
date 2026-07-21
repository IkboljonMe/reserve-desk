"use client";

import Dropdown from "@/components/ui/Dropdown";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useTranslation } from "@/i18n";
import { HotelFilterList, ServiceFilterList } from "./CalendarFilterLists";
import type { ViewMode, Density, StatusFilter } from "../constants";
import type { CalendarPageState } from "../useCalendarPage";

// Mobile-only filter sheet: consolidates view / density / status dropdowns and
// the hotel + service filters into one full-screen modal, so the calendar
// toolbar stays a single "Filters" button. Changes apply live.
export function CalendarFilterModal({
  s,
  open,
  onClose,
}: {
  s: CalendarPageState;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { view, setView, density, setDensity, statusFilter, setStatusFilter } =
    s;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("filters")}
      size="sm"
      closeLabel={t("close")}
      footer={
        <Button
          variant="primary"
          className="w-full justify-center"
          onClick={onClose}
        >
          {t("close")}
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="flex-1 min-w-0">
            <Dropdown
              label={t("view")}
              value={view}
              onChange={(val) => setView(val as ViewMode)}
              options={[
                { value: "day", label: t("day") },
                { value: "week", label: t("periodWeek") },
                { value: "month", label: t("periodMonth") },
              ]}
            />
          </div>
          {view !== "month" && (
            <div className="flex-1 min-w-0">
              <Dropdown
                label={t("density")}
                value={density}
                onChange={(val) => setDensity(val as Density)}
                options={[
                  { value: "Compact", label: "S" },
                  { value: "Cozy", label: "M" },
                  { value: "Roomy", label: "L" },
                ]}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Dropdown
              label={t("status")}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as StatusFilter)}
              options={[
                { value: "all", label: t("allStatuses") },
                { value: "unpaid", label: t("unpaid") },
                { value: "paid", label: t("paid") },
                { value: "finished", label: t("finished") },
              ]}
            />
          </div>
        </div>

        <HotelFilterList s={s} />
        <ServiceFilterList s={s} />
      </div>
    </Modal>
  );
}
