"use client";

import { useTranslation } from "@/i18n";
import Spinner from "@/components/ui/Spinner";
import Input from "@/components/ui/Input";
import type { ClientsPageState } from "../useClientsPage";
import Button from "@/components/ui/Button";

export function ClientModal({ s }: { s: ClientsPageState }) {
  const { t } = useTranslation();
  const {
    modalOpen,
    editClient,
    closeModal,
    handleSave,
    saving,
    form,
    setForm,
    modalGroups,
  } = s;
  if (!modalOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editClient ? t("editClientTitle") : t("addClient")}</h2>
          <Button
            variant="ghost"
            icon
            onClick={closeModal}
            aria-label={t("close")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Button>
        </div>

        <form onSubmit={handleSave}>
          <div className="flex flex-col gap-4">
            <Input
              label={`${t("fullName")} *`}
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={t("fullNamePlaceholder")}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
                {t("group")}
              </label>
              <select
                className="w-full px-3 py-2 min-h-9.5 rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-(--gray-200,#e5e7eb) text-[--gray-800] hover:border-(--gray-300) focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
                value={form.groupId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, groupId: e.target.value }))
                }
              >
                <option value="">{t("noGroup")}</option>
                {modalGroups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
              {modalGroups.length === 0 && (
                <p className="mt-1.5 text-xs text-gray-500">
                  {t("noGroupsYet")}
                </p>
              )}
            </div>

            <Input
              label={t("phone")}
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+998 90 123 45 67"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
                {t("notes")}
              </label>
              <textarea
                className="w-full px-3 py-2 min-h-18 rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-(--gray-200,#e5e7eb) text-[--gray-800] hover:border-(--gray-300) focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)] resize-y"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder={t("notesClientPlaceholder")}
              />
            </div>
          </div>

          <div className="h-px bg-surface-border my-4" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner size={18} dark={false} /> : null}
              {saving ? t("saving") : editClient ? t("save") : t("addClient")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
