"use client";

import { useTranslation } from "@/i18n";
import { STATUS_META } from "../constants";
import { daysLeftOf, fmtDate } from "../utils";
import { ExpiryPill } from "./ExpiryPill";
import { SkeletonTableRows } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ContractsPageState } from "../useContractsPage";
import Button from "@/components/ui/Button";

export function ContractsTable({ s }: { s: ContractsPageState }) {
  const { t } = useTranslation();
  const {
    contracts,
    visible,
    loading,
    multiHotel,
    hotelLabel,
    openAdd,
    openEdit,
    deleteConfirm,
    setDeleteConfirm,
    handleDelete,
  } = s;

  return (
    <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[var(--radius-lg)] shadow-sm p-0 overflow-hidden max-[768px]:-mx-[1.1rem] max-[768px]:rounded-none max-[768px]:border-x-0">
      {loading ? (
        <table className="w-full border-collapse text-sm">
          <tbody>
            <SkeletonTableRows rows={6} columns={multiHotel ? 8 : 7} />
          </tbody>
        </table>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M16 13H8M16 17H8M10 9H8" />
            </svg>
          }
        >
          <h3 className="text-gray-700">
            {contracts.length === 0
              ? t("noContractsYet")
              : t("noContractsMatch")}
          </h3>
          <p>
            {contracts.length === 0
              ? t("noContractsDesc")
              : t("tryClearFilters")}
          </p>
          {contracts.length === 0 && (
            <Button className="mt-2" onClick={openAdd}>
              {t("addFirstContract")}
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[920px]">
            <thead>
              <tr className="border-b border-[var(--gray-200,#e5e7eb)] bg-[var(--gray-50,#f9fafb)]">
                {(
                  [
                    ["organization", t("organization")],
                    ...(multiHotel ? [["hotel", t("hotel")]] : []),
                    ["contractNo", t("contractNo")],
                    ["representative", t("representative")],
                    ["status", t("status")],
                    ["finishDate", t("finishDate")],
                    ["renewal", t("renewal")],
                    ["link", t("link")],
                    ["actions", ""],
                  ] as [string, string][]
                ).map(([key, label]) => (
                  <th
                    key={key}
                    className="px-4 py-2.5 text-left font-semibold text-[var(--gray-500,#6b7280)] text-xs whitespace-nowrap"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((c, i) => {
                const dl = daysLeftOf(c.finishDate);
                const sm = STATUS_META[c.status];
                return (
                  <tr
                    key={c._id}
                    className={`border-b border-[var(--gray-100,#f3f4f6)] ${i % 2 === 0 ? "bg-white" : "bg-[var(--gray-50,#f9fafb)]"}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[var(--brand-50,#eef2ff)] text-[var(--brand-600,#4f46e5)] flex items-center justify-center font-bold text-[0.8125rem] shrink-0">
                          {c.organizationName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[--gray-800] whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px]">
                            {c.organizationName}
                          </div>
                          {c.inn && (
                            <div className="text-[0.72rem] text-[var(--gray-400)]">
                              {t("inn")} {c.inn}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    {multiHotel && (
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[var(--gray-100,#f3f4f6)] text-[var(--gray-700,#374151)] font-semibold text-[0.78rem] whitespace-nowrap">
                          {hotelLabel(c.hotelId)}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-[var(--gray-700)] font-semibold whitespace-nowrap">
                      {c.contractNumber || (
                        <span className="text-[var(--gray-300)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[--gray-600]">
                      {c.representativeName ? (
                        <div className="min-w-0">
                          <div className="whitespace-nowrap">
                            {c.representativeName}
                          </div>
                          {c.phone && (
                            <div className="text-[0.72rem] text-[var(--gray-400)]">
                              {c.phone}
                            </div>
                          )}
                        </div>
                      ) : (
                        c.phone || (
                          <span className="text-[var(--gray-300)]">—</span>
                        )
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[0.78rem] whitespace-nowrap"
                        style={{ background: sm.bg, color: sm.color }}
                      >
                        <span
                          className="w-1.75 h-1.75 rounded-full"
                          style={{ background: sm.color }}
                        />
                        {t(sm.labelKey)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--gray-700)] whitespace-nowrap">
                      {fmtDate(c.finishDate)}
                    </td>
                    <td className="px-4 py-3">
                      <ExpiryPill status={c.status} daysLeft={dl} />
                    </td>
                    <td className="px-4 py-3">
                      {c.contractLink ? (
                        <a
                          href={c.contractLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 rounded-sm py-1.5 px-3 text-[0.8125rem] font-semibold text-[var(--brand-600,#4f46e5)] whitespace-nowrap tracking-tight transition-colors duration-150 hover:bg-[var(--gray-50,#f9fafb)] hover:text-[--gray-800]"
                          title={c.contractLink}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                          {t("openLink")}
                        </a>
                      ) : (
                        <span className="text-[var(--gray-300)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 justify-end">
                        <Button
                          variant="ghost"
                          icon
                          onClick={() => openEdit(c)}
                          title={t("edit")}
                          aria-label={t("editContractAria")}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </Button>
                        {deleteConfirm === c._id ? (
                          <div className="flex gap-1 items-center">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(c._id)}
                            >
                              {t("delete")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              {t("cancel")}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            icon
                            onClick={() => setDeleteConfirm(c._id)}
                            title={t("delete")}
                            aria-label={t("deleteContractAria")}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="var(--danger)"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
