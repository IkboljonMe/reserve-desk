"use client";

import { useTranslation } from "@/i18n";
import Dropdown from "@/components/ui/Dropdown";
import Button from "@/components/ui/Button";
import type { ContractStatus } from "./ContractModal";
import type { ExpiryFilter, SortKey } from "../constants";
import type { ContractsPageState } from "../useContractsPage";

// The contract filter controls (search + status/expiry/sort dropdowns + clear).
// `stack` lays them out vertically full-width for the mobile filter modal; the
// default is the horizontal wrap-row used in the desktop filter bar.
export function ContractsFilterControls({
  s,
  stack = false,
}: {
  s: ContractsPageState;
  stack?: boolean;
}) {
  const { t } = useTranslation();
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    hotelFilter,
    setHotelFilter,
    expiryFilter,
    setExpiryFilter,
    sortKey,
    setSortKey,
    activeFilterCount,
    clearFilters,
    hotels,
    multiHotel,
  } = s;

  return (
    <div
      className={
        stack ? "flex flex-col gap-3" : "flex items-center gap-3 flex-wrap"
      }
    >
      <div
        className={`flex items-center gap-2 ${stack ? "w-full rounded-lg border border-(--surface-border) px-3 py-2" : "flex-1 min-w-55"}`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--gray-400)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm text-[--gray-800] placeholder:text-(--gray-400) px-1"
          placeholder={t("searchContractsPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={stack ? "w-full" : "min-w-37.5"}>
        <Dropdown
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as "" | ContractStatus)}
          options={[
            { value: "", label: t("allStatuses") },
            { value: "signed", label: t("signed") },
            { value: "awaiting", label: t("awaitingSignature") },
            { value: "terminated", label: t("terminated") },
          ]}
          ariaLabel={t("filterByStatus")}
        />
      </div>

      {multiHotel && (
        <div className={stack ? "w-full" : "min-w-40"}>
          <Dropdown
            value={hotelFilter}
            onChange={setHotelFilter}
            options={[
              { value: "", label: t("allHotels") },
              ...hotels.map((h) => ({
                value: h._id,
                label: h.shortName || h.name || "—",
              })),
            ]}
            ariaLabel={t("filterByHotel")}
          />
        </div>
      )}

      <div className={stack ? "w-full" : "min-w-40"}>
        <Dropdown
          value={expiryFilter}
          onChange={(val) => setExpiryFilter(val as ExpiryFilter)}
          options={[
            { value: "all", label: t("anyExpiry") },
            { value: "expiring", label: t("expiringSoon30") },
            { value: "expired", label: t("expired") },
            { value: "active", label: t("activeOver30") },
          ]}
          ariaLabel={t("filterByExpiry")}
        />
      </div>

      <div className={stack ? "w-full" : "min-w-37.5"}>
        <Dropdown
          value={sortKey}
          onChange={(val) => setSortKey(val as SortKey)}
          options={[
            { value: "finishSoon", label: t("finishSoonest") },
            { value: "finishLate", label: t("finishLatest") },
            { value: "nameAsc", label: t("nameAZ") },
          ]}
          ariaLabel={t("sort")}
        />
      </div>

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className={stack ? "w-full justify-center" : undefined}
          onClick={clearFilters}
        >
          {t("clearFilters")}
        </Button>
      )}
    </div>
  );
}
