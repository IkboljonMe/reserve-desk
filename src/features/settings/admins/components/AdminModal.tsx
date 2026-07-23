"use client";

import { X } from "lucide-react";
import { useTranslation } from "@/i18n";
import Spinner from "@/components/ui/Spinner";
import Input from "@/components/ui/Input";
import { bronitLocalPart, BRONIT_DOMAIN } from "@/lib/bronitEmail";
import type { AdminsPageState } from "../useAdminsPage";
import Button from "@/components/ui/Button";

const FIELD_CLASS =
  "w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[--gray-800] hover:border-[var(--gray-300)] focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]";

export function AdminModal({ s }: { s: AdminsPageState }) {
  const { t } = useTranslation();
  const {
    modalOpen,
    editAdmin,
    closeModal,
    handleSave,
    saving,
    form,
    setForm,
    setEmailLocalPart,
    hotels,
  } = s;
  if (!modalOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal max-w-[440px]" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editAdmin ? t("editAdmin") : t("addAdmin")}</h2>
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
            <Input
              label={`${t("fullName")} *`}
              required
              autoFocus
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
                {t("email")} *
              </label>
              {editAdmin ? (
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              ) : (
                <div className="flex items-stretch">
                  <input
                    className={`${FIELD_CLASS} rounded-r-none`}
                    required
                    value={bronitLocalPart(form.email)}
                    onChange={(e) => setEmailLocalPart(e.target.value)}
                  />
                  <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-[var(--gray-200)] bg-[var(--gray-50)] text-[--gray-500] text-sm whitespace-nowrap">
                    {BRONIT_DOMAIN}
                  </span>
                </div>
              )}
            </div>

            <Input
              label={`${t("password")} ${editAdmin ? "" : "*"}`}
              type="password"
              required={!editAdmin}
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              helperText={editAdmin ? t("passwordKeepHint") : undefined}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
                {t("hotel")} *
              </label>
              <select
                className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[--gray-800] hover:border-[var(--gray-300)] focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
                required
                value={form.hotelId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hotelId: e.target.value }))
                }
              >
                <option value="" disabled>
                  {t("selectHotel")}
                </option>
                {hotels.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name} ({h.shortName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-px bg-surface-border my-4" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner size={18} dark={false} /> : null}
              {saving ? t("saving") : editAdmin ? t("save") : t("addAdmin")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
