"use client";

import { useTranslation } from "@/i18n";
import type { ClientsPageState } from "../useClientsPage";

export function ClientsFilters({ s }: { s: ClientsPageState }) {
  const { t } = useTranslation();
  const { search, setSearch, groupFilter, setGroupFilter, groups } = s;

  return (
    <div className="bg-(--surface-card) border border-(--surface-border) rounded-(--radius-lg) shadow-sm p-4 mb-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-50">
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
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm text-gray-800 placeholder:text-gray-400 px-1"
            placeholder={t("searchClientsPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="w-auto min-w-40 px-3 py-1.75 min-h-9.5 rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-(--gray-200,#e5e7eb) text-(--gray-800) hover:border-(--gray-300) focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          aria-label={t("filterByGroup")}
        >
          <option value="">{t("allGroups")}</option>
          {groups.map((g) => (
            <option key={g._id} value={g._id}>
              {g.name}
            </option>
          ))}
          <option value="none">{t("ungrouped")}</option>
        </select>
      </div>
    </div>
  );
}
