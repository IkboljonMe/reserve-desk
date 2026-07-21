"use client";

import { Building2 } from "lucide-react";
import { getServiceIcon } from "@/lib/serviceIcons";
import { svcId } from "@/lib/bookingHelpers";
import { useTranslation } from "@/i18n";
import type { CalendarPageState } from "../useCalendarPage";

// Hotel and service filter cards, shared by the desktop sidebar and the mobile
// filter modal so the checkbox behaviour lives in one place.

export function HotelFilterList({ s }: { s: CalendarPageState }) {
  const { t } = useTranslation();
  const {
    hotels,
    selectedHotels,
    setSelectedHotels,
    allHotelsSelected,
    visibleBookings,
    serviceHotel,
  } = s;

  if (hotels.length === 0) return null;

  return (
    <div className="bg-(--surface-card) border border-(--surface-border) rounded-(--radius-lg) shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[0.8125rem] m-0 flex items-center gap-1.5">
          <Building2 size={14} className="text-(--gray-400)" /> {t("hotels")}
        </h3>
        <button
          onClick={() =>
            setSelectedHotels(
              allHotelsSelected ? new Set() : new Set(hotels.map((h) => h._id)),
            )
          }
          className="bg-transparent border-none text-(--brand-600) text-[0.72rem] font-semibold cursor-pointer"
        >
          {allHotelsSelected ? t("clear") : t("all")}
        </button>
      </div>
      <div className="flex flex-col gap-1">
        {hotels.map((h) => {
          const checked = selectedHotels.has(h._id);
          const count = visibleBookings.filter(
            (b) => (serviceHotel.get(svcId(b)) || "") === h._id,
          ).length;
          return (
            <button
              key={h._id}
              onClick={() =>
                setSelectedHotels((prev) => {
                  const next = new Set(prev);
                  if (checked) next.delete(h._id);
                  else next.add(h._id);
                  return next;
                })
              }
              className={`flex items-center gap-2.25 text-left p-[5px_7px] rounded-lg border-none cursor-pointer transition-all duration-120 font-sans ${
                checked
                  ? "bg-brand-500/10 opacity-100"
                  : "bg-transparent opacity-50"
              }`}
            >
              <span
                className={`min-w-7.5 h-5.5 px-1.5 rounded-md shrink-0 flex items-center justify-center font-bold text-[0.66rem] tracking-wide ${
                  checked
                    ? "bg-(--brand-500) text-white"
                    : "bg-(--gray-200) text-(--gray-500)"
                }`}
              >
                {h.shortName}
              </span>
              <span
                className={`text-[0.8rem] text-(--gray-700) flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${
                  checked ? "font-semibold" : "font-normal"
                }`}
              >
                {h.name}
              </span>
              {count > 0 && (
                <span className="text-[0.68rem] font-bold text-(--brand-600) bg-(--brand-100) rounded-full px-1.75">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ServiceFilterList({ s }: { s: CalendarPageState }) {
  const { t } = useTranslation();
  const {
    services,
    selectedServices,
    setSelectedServices,
    allSelected,
    visibleBookings,
  } = s;

  return (
    <div className="bg-(--surface-card) border border-(--surface-border) rounded-(--radius-lg) shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[0.8125rem] m-0">{t("services")}</h3>
        <button
          onClick={() =>
            setSelectedServices(
              allSelected ? new Set() : new Set(services.map((svc) => svc._id)),
            )
          }
          className="bg-transparent border-none text-(--brand-600) text-[0.72rem] font-semibold cursor-pointer"
        >
          {allSelected ? t("clear") : t("all")}
        </button>
      </div>
      <div className="flex flex-col gap-1">
        {services.map((svc) => {
          const checked = selectedServices.has(svc._id);
          const count = visibleBookings.filter(
            (b) => svcId(b) === svc._id && b.status !== "cancelled",
          ).length;
          return (
            <button
              key={svc._id}
              onClick={() =>
                setSelectedServices((prev) => {
                  const next = new Set(prev);
                  if (checked) next.delete(svc._id);
                  else next.add(svc._id);
                  return next;
                })
              }
              className={`flex items-center gap-2.25 text-left p-[5px_7px] rounded-lg border-none cursor-pointer transition-all duration-120 font-sans ${
                checked ? "opacity-100" : "bg-transparent opacity-50"
              }`}
              style={{
                background: checked ? `${svc.color}0f` : "transparent",
              }}
            >
              <span
                className="w-5.5 h-5.5 rounded-md shrink-0 flex items-center justify-center"
                style={{
                  background: `${svc.color}22`,
                  color: svc.color,
                  border: `1.5px solid ${checked ? svc.color : "transparent"}`,
                }}
              >
                {getServiceIcon(svc.name)}
              </span>
              <span
                className={`text-[0.8rem] text-(--gray-700) flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${
                  checked ? "font-semibold" : "font-normal"
                }`}
              >
                {svc.name}
              </span>
              {count > 0 && (
                <span
                  className="text-[0.68rem] font-bold rounded-full px-1.75"
                  style={{ color: svc.color, background: `${svc.color}18` }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
        {services.length === 0 && (
          <p className="text-[0.75rem] text-(--gray-400)">
            {t("noServicesYet")}
          </p>
        )}
      </div>
    </div>
  );
}
