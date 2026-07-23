"use client";

import { Check, X } from "lucide-react";
import { useTranslation } from "@/i18n";
import Spinner from "@/components/ui/Spinner";
import { PRESET_COLORS } from "../useClientGroupsPage";
import type { ClientGroupsPageState } from "../useClientGroupsPage";
import Button from "@/components/ui/Button";

export function GroupModal({ s }: { s: ClientGroupsPageState }) {
  const { t } = useTranslation();
  const {
    modalOpen,
    editGroup,
    closeModal,
    handleSave,
    saving,
    form,
    setForm,
  } = s;
  if (!modalOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal max-w-105" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editGroup ? t("editGroup") : t("addGroup")}</h2>
          <Button
            variant="ghost"
            icon
            onClick={closeModal}
            aria-label={t("close")}
          >
            <X size={18} />
          </Button>
        </div>

        <form onSubmit={handleSave}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
                {t("groupName")} *
              </label>
              <input
                className="w-full px-3 py-2 min-h-9.5 rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-(--gray-200,#e5e7eb) text-[--gray-800] hover:border-(--gray-300) focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
                required
                autoFocus
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder={t("groupNamePlaceholder")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
                {t("color")}
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    aria-label={t("selectColor", { color: c })}
                    className={`w-7 h-7 rounded-full cursor-pointer flex items-center justify-center transition-all duration-150 ${
                      form.color === c
                        ? "ring-2 ring-(--gray-800,#1f2937) ring-offset-2"
                        : ""
                    }`}
                    style={{ background: c }}
                  >
                    {form.color === c && (
                      <Check size={14} color="#fff" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-surface-border my-4" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner size={18} dark={false} /> : null}
              {saving ? t("saving") : editGroup ? t("save") : t("addGroup")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
