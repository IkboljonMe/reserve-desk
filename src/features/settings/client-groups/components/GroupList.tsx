"use client";

import { Pencil, Trash2, Users } from "lucide-react";
import { useTranslation } from "@/i18n";
import { SkeletonTableRows } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ClientGroupsPageState } from "../useClientGroupsPage";
import Button from "@/components/ui/Button";

export function GroupList({ s }: { s: ClientGroupsPageState }) {
  const { t } = useTranslation();
  const {
    groups,
    loading,
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
      ) : groups.length === 0 ? (
        <EmptyState icon={<Users size={24} strokeWidth={1.75} />}>
          <h3 className="text-gray-700">{t("noGroupsTitle")}</h3>
          <p>{t("noGroupsDesc")}</p>
          <Button className="mt-2" onClick={openAdd}>
            {t("addFirstGroup")}
          </Button>
        </EmptyState>
      ) : (
        <div className="flex flex-col">
          {groups.map((g, i) => (
            <div
              key={g._id}
              className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? "" : "border-t border-[var(--gray-100,#f3f4f6)]"}`}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: g.color }}
              />
              <span className="font-semibold text-[--gray-800] flex-1">
                {g.name}
              </span>
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  icon
                  onClick={() => openEdit(g)}
                  title={t("edit")}
                  aria-label={t("editGroupAria")}
                >
                  <Pencil size={14} />
                </Button>
                {deleteConfirm === g._id ? (
                  <div className="flex gap-1 items-center">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(g._id)}
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
                    onClick={() => setDeleteConfirm(g._id)}
                    title={t("delete")}
                    aria-label={t("deleteGroupAria")}
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
