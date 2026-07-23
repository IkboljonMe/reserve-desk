"use client";

import { Search, Filter, X } from "lucide-react";
import { useTranslation } from "@/i18n";
import type { ServicesPageState } from "../useServicesPage";
import Button from "@/components/ui/Button";

export function ServicesFilterBar({ s }: { s: ServicesPageState }) {
  const { t } = useTranslation();
  const {
    hotels,
    searchQuery,
    setSearchQuery,
    filterHotel,
    setFilterHotel,
    filterStatus,
    setFilterStatus,
    hasActiveFilters,
  } = s;

  return (
    <div className="flex items-center gap-3 flex-wrap mb-6">
      {/* Search */}
      <div className="relative flex-[0_1_320px] min-w-50">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-(--gray-400) pointer-events-none"
        />
        <input
          className="w-full pl-9 pr-3 py-1.75 min-h-9.5 rounded-lg text-[0.8125rem] outline-none transition-all duration-150 bg-white border border-(--gray-200,#e5e7eb) text-(--gray-800) hover:border-(--gray-300) focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
          placeholder={t("searchServices")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label={t("searchServices")}
        />
      </div>

      {/* Filters group, pushed to the right */}
      <div className="w-px h-6 bg-(--gray-200,#e5e7eb) shrink-0 ml-auto max-[720px]:hidden" />

      {/* Hotel filter pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="flex items-center gap-1 text-[0.75rem] text-(--gray-400) font-semibold uppercase tracking-wider">
          <Filter size={12} /> {t("hotel")}
        </span>
        <button
          className={`px-3.5 py-1.5 rounded-full text-[0.8rem] font-semibold cursor-pointer border transition-all duration-150 whitespace-nowrap ${
            filterHotel === ""
              ? "bg-linear-to-r from-(--brand-500) to-(--brand-600) text-white border-transparent shadow-(--shadow-brand)"
              : "border-(--gray-200,#e5e7eb) bg-(--surface-card) text-(--gray-600,#4b5563) hover:border-(--brand-500,#6366f1) hover:text-(--brand-700,#4338ca) hover:bg-(--brand-50,#eef2ff)"
          }`}
          onClick={() => setFilterHotel("")}
        >
          {t("all")}
        </button>
        {hotels.map((h) => (
          <button
            key={h._id}
            className={`px-3.5 py-1.5 rounded-full text-[0.8rem] font-semibold cursor-pointer border transition-all duration-150 whitespace-nowrap ${
              filterHotel === h._id
                ? "bg-linear-to-r from-(--brand-500) to-(--brand-600) text-white border-transparent shadow-(--shadow-brand)"
                : "border-(--gray-200,#e5e7eb) bg-(--surface-card) text-(--gray-600,#4b5563) hover:border-(--brand-500,#6366f1) hover:text-(--brand-700,#4338ca) hover:bg-(--brand-50,#eef2ff)"
            }`}
            onClick={() => setFilterHotel(filterHotel === h._id ? "" : h._id)}
          >
            {h.shortName || h.name}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-(--gray-200,#e5e7eb) shrink-0 max-[720px]:hidden" />

      {/* Status filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-[0.75rem] text-(--gray-400) font-semibold uppercase tracking-wider">
          {t("status")}
        </span>
        {(["", "active", "inactive"] as const).map((val) => (
          <button
            key={val || "all"}
            className={`px-3.5 py-1.5 rounded-full text-[0.8rem] font-semibold cursor-pointer border transition-all duration-150 whitespace-nowrap ${
              filterStatus === val
                ? "bg-linear-to-r from-(--brand-500) to-(--brand-600) text-white border-transparent shadow-(--shadow-brand)"
                : "border-(--gray-200,#e5e7eb) bg-(--surface-card) text-(--gray-600,#4b5563) hover:border-(--brand-500,#6366f1) hover:text-(--brand-700,#4338ca) hover:bg-(--brand-50,#eef2ff)"
            }`}
            onClick={() => setFilterStatus(val)}
          >
            {val === "" ? t("all") : t(val)}
          </button>
        ))}
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchQuery("");
            setFilterHotel("");
            setFilterStatus("");
          }}
          className="ml-auto text-(--gray-400) text-[0.75rem]"
        >
          <X size={13} /> {t("clear")}
        </Button>
      )}
    </div>
  );
}
