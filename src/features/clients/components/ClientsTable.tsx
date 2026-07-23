"use client";

import { BedDouble, History } from "lucide-react";
import { useTranslation } from "@/i18n";
import { SkeletonTableRows } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ClientsPageState } from "../useClientsPage";
import Button from "@/components/ui/Button";

export function ClientsTable({ s }: { s: ClientsPageState }) {
  const { t } = useTranslation();
  const {
    clients,
    loading,
    openAdd,
    openEdit,
    deleteConfirm,
    setDeleteConfirm,
    handleDelete,
    clientGroup,
    setHistoryClient,
  } = s;

  return (
    <div className="bg-(--surface-card) border border-(--surface-border) rounded-(--radius-lg) shadow-sm p-0 overflow-hidden">
      {loading ? (
        <table className="w-full border-collapse text-sm">
          <tbody>
            <SkeletonTableRows rows={6} columns={7} />
          </tbody>
        </table>
      ) : clients.length === 0 ? (
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
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        >
          <h3 className="text-gray-700">{t("noClientsYet")}</h3>
          <p>{t("noClientsDesc")}</p>
          <Button className="mt-2" onClick={openAdd}>
            {t("addFirstClient")}
          </Button>
        </EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-180">
            <thead>
              <tr className="border-b border-(--gray-200,#e5e7eb) bg-(--gray-50,#f9fafb)">
                {[
                  ["guest", t("guest")],
                  ["group", t("group")],
                  ["room", t("room")],
                  ["floor", t("floor")],
                  ["phone", t("phone")],
                  ["notes", t("notes")],
                  ["actions", ""],
                ].map(([key, col]) => (
                  <th
                    key={key}
                    className="px-4 py-2.5 text-left font-semibold text-(--gray-500,#6b7280) text-xs"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr
                  key={c._id}
                  className={`border-b border-(--gray-100,#f3f4f6) ${i % 2 === 0 ? "bg-white" : "bg-(--gray-50,#f9fafb)"}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-(--brand-50,#eef2ff) text-(--brand-600,#4f46e5) flex items-center justify-center font-bold text-[0.8125rem] shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-(--gray-800)">
                        {c.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const g = clientGroup(c);
                      return g ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[0.8125rem]"
                          style={{ background: `${g.color}1a`, color: g.color }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: g.color }}
                          />
                          {g.name}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    {c.roomNumber ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-(--brand-50,#eef2ff) text-(--brand-700,#4338ca) font-semibold text-[0.8125rem]">
                        <BedDouble size={12} /> {c.roomNumber}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.floor > 0 ? `${t("floor")} ${c.floor}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.phone || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-(--gray-500) text-[0.8125rem] max-w-50 truncate">
                    {c.notes || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 justify-end">
                      <Button
                        variant="ghost"
                        icon
                        onClick={() => setHistoryClient(c)}
                        title={t("bookingHistory")}
                        aria-label={t("bookingHistory")}
                      >
                        <History size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        icon
                        onClick={() => openEdit(c)}
                        title={t("edit")}
                        aria-label={t("editClientAria")}
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
                          aria-label={t("deleteClientAria")}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
