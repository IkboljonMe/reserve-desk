"use client";

import { Layers, Building2 } from "lucide-react";
import { useTranslation } from "@/i18n";
import Dropdown from "@/components/ui/Dropdown";
import type { MenuModeState } from "../useMenuMode";
import type { MenuHotel } from "../types";

// Owner control for the company's menu scope: one shared menu for every hotel,
// or a separate menu per hotel. Shown only when the company has >1 hotel.
export function MenuModeControl({
  mode,
  hotels,
}: {
  mode: MenuModeState;
  hotels: MenuHotel[];
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-(--surface-card) border border-(--surface-border) rounded-(--radius-lg) shadow-sm p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-start gap-2.5 min-w-0">
        <span className="w-9 h-9 rounded-lg bg-(--brand-50,#eef2ff) text-(--brand-600,#4f46e5) flex items-center justify-center shrink-0">
          {mode.shared ? <Layers size={17} /> : <Building2 size={17} />}
        </span>
        <div className="min-w-0">
          <h3 className="text-[0.9rem] font-bold text-(--gray-800) m-0">
            {t("menuScope")}
          </h3>
          <p className="text-[0.78rem] text-(--gray-500) m-0 mt-0.5">
            {mode.shared ? t("menuScopeSharedDesc") : t("menuScopePerHotelDesc")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="w-44">
          <Dropdown
            value={mode.mode}
            onChange={(v) =>
              mode.update({
                mode: v as "per_hotel" | "shared",
                sourceHotelId: mode.sourceHotelId ?? undefined,
              })
            }
            options={[
              { value: "per_hotel", label: t("menuScopePerHotel") },
              { value: "shared", label: t("menuScopeShared") },
            ]}
            ariaLabel={t("menuScope")}
          />
        </div>
        {mode.shared && (
          <div className="w-44">
            <Dropdown
              value={mode.sourceHotelId ?? ""}
              onChange={(v) => mode.update({ mode: "shared", sourceHotelId: v })}
              options={hotels.map((h) => ({ value: h._id, label: h.name }))}
              ariaLabel={t("sharedMenuSource")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
