"use client";

import { Pencil, Trash2, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/i18n";
import { SkeletonTableRows } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import type { AdminsPageState } from "../useAdminsPage";
import Button from "@/components/ui/Button";

export function AdminList({ s }: { s: AdminsPageState }) {
  const { t } = useTranslation();
  const {
    admins,
    loading,
    noHotels,
    openAdd,
    openEdit,
    deleteConfirm,
    setDeleteConfirm,
    handleDelete,
  } = s;

  return (
    <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[var(--radius-lg)] shadow-sm p-0 overflow-hidden">
      {loading ? (
        <table className="w-full border-collapse">
          <tbody>
            <SkeletonTableRows rows={4} columns={3} />
          </tbody>
        </table>
      ) : admins.length === 0 ? (
        <EmptyState icon={<ShieldCheck size={24} strokeWidth={1.75} />}>
          <h3 className="text-gray-700">{t("noAdminsTitle")}</h3>
          <p>{noHotels ? t("addHotelFirst") : t("noAdminsDesc")}</p>
          {!noHotels && (
            <Button className="mt-2" onClick={openAdd}>
              {t("addFirstAdmin")}
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="flex flex-col">
          {admins.map((a, i) => (
            <div
              key={a._id}
              className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? "" : "border-t border-[var(--gray-100,#f3f4f6)]"}`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[--gray-800]">{a.name}</div>
                <div className="text-[0.8125rem] text-[var(--gray-500)]">
                  {a.email}
                </div>
              </div>
              <Badge variant="gray" className="shrink-0">
                {a.hotelId
                  ? `${a.hotelId.name} (${a.hotelId.shortName})`
                  : t("noHotelAssigned")}
              </Badge>
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  icon
                  onClick={() => openEdit(a)}
                  title={t("edit")}
                  aria-label={t("editAdminAria")}
                >
                  <Pencil size={14} />
                </Button>
                {deleteConfirm === a._id ? (
                  <div className="flex gap-1 items-center">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(a._id)}
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
                    onClick={() => setDeleteConfirm(a._id)}
                    title={t("delete")}
                    aria-label={t("deleteAdminAria")}
                  >
                    <Trash2 size={14} color="var(--danger)" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
