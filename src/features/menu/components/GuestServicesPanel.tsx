"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Sparkles } from "lucide-react";
import { useTranslation } from "@/i18n";
import Button from "@/components/ui/Button";
import { money } from "@/lib/bookingHelpers";
import type { GuestServicesState } from "../useGuestServices";
import { GuestServiceModal } from "./GuestServiceModal";

const CARD =
  "bg-(--surface-card) border border-(--surface-border) rounded-[var(--radius-lg)] shadow-sm";

// Manager list of a hotel's guest-hub services: add, edit, delete, and toggle
// each one's visibility on the guest landing (hidden = not shown to guests).
export function GuestServicesPanel({
  s,
  lang,
}: {
  s: GuestServicesState;
  lang: string;
}) {
  const { t } = useTranslation();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <div className={CARD}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-(--surface-border)">
        <h2 className="text-[1rem] font-bold text-[--gray-800] m-0">
          {t("guestServices")}
        </h2>
        <Button
          size="sm"
          leftIcon={<Plus size={14} strokeWidth={2.5} />}
          onClick={s.openAdd}
        >
          {t("addService")}
        </Button>
      </div>

      {s.loading ? (
        <p className="px-4 py-6 text-sm text-(--gray-400)">{t("loading")}</p>
      ) : s.services.length === 0 ? (
        <div className="px-4 py-10 flex flex-col items-center text-center gap-2">
          <Sparkles size={24} className="text-(--gray-400)" />
          <h3 className="text-(--gray-700) font-bold m-0">
            {t("noGuestServicesYet")}
          </h3>
          <p className="text-[--gray-500] text-sm m-0">
            {t("noGuestServicesDesc")}
          </p>
        </div>
      ) : (
        <ul className="list-none m-0 p-0 divide-y divide-(--surface-border)">
          {s.services.map((g) => {
            const gname = g.nameI18n?.[lang as keyof typeof g.nameI18n] || g.name;
            return (
              <li key={g._id} className="flex items-center gap-3 px-4 py-2.5">
                {g.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary hotel-supplied URLs; next/image needs configured domains
                  <img
                    src={g.imageUrl}
                    alt=""
                    className="w-9 h-9 rounded-md object-cover shrink-0"
                  />
                ) : (
                  <span className="w-9 h-9 rounded-md bg-(--gray-100) shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold text-[0.9rem] truncate ${g.active ? "text-[--gray-800]" : "text-(--gray-400) line-through"}`}
                    >
                      {gname}
                    </span>
                    {!g.active && (
                      <span className="text-[0.68rem] font-bold text-(--gray-400) uppercase">
                        {t("hidden")}
                      </span>
                    )}
                  </div>
                </div>
                {g.price > 0 && (
                  <span className="text-[0.85rem] font-bold text-(--gray-700) tabular-nums whitespace-nowrap">
                    {money(g.price)} {t("sum")}
                  </span>
                )}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    icon
                    onClick={() => s.toggleActive(g)}
                    aria-label={g.active ? t("hide") : t("show")}
                    title={g.active ? t("hide") : t("show")}
                  >
                    {g.active ? (
                      <Eye size={14} className="text-(--gray-600)" />
                    ) : (
                      <EyeOff size={14} className="text-(--gray-400)" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    icon
                    onClick={() => s.openEdit(g)}
                    aria-label={t("edit")}
                  >
                    <Pencil size={14} />
                  </Button>
                  {confirmId === g._id ? (
                    <span className="inline-flex items-center gap-1">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          s.remove(g._id);
                          setConfirmId(null);
                        }}
                      >
                        {t("delete")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmId(null)}
                      >
                        {t("cancel")}
                      </Button>
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      icon
                      onClick={() => setConfirmId(g._id)}
                      aria-label={t("delete")}
                    >
                      <Trash2 size={14} className="text-(--danger)" />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <GuestServiceModal s={s} />
    </div>
  );
}
