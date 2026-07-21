"use client";

import Dropdown from "@/components/ui/Dropdown";
import { useTranslation } from "@/i18n";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { StatusFilter } from "../constants";
import type { CalendarPageState } from "../useCalendarPage";

export function CalendarFilters({ s }: { s: CalendarPageState }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { statusFilter, setStatusFilter } = s;

  // Status filter lives here on desktop only; on mobile it's in the toolbar's
  // compact stack. Search was removed, so there's nothing to show on mobile.
  if (isMobile) return null;

  return (
    <div className="flex items-center gap-2.5 mb-3.5 flex-wrap">
      <div className="min-w-35">
        <Dropdown
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
  );
}
