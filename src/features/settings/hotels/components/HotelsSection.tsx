"use client";

import {
  Building2,
  MapPin,
  Trash2,
  Plus,
  Check,
  X,
  BedDouble,
  Pencil,
} from "lucide-react";
import { useTranslation } from "@/i18n";
import { displayCode } from "../utils";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { HotelsRoomsPageState } from "../useHotelsRoomsPage";
import Button from "@/components/ui/Button";

export function HotelsSection({ s }: { s: HotelsRoomsPageState }) {
  const { t } = useTranslation();
  const {
    hotels,
    loading,
    openHotelModal,
    openEditHotel,
    roomsByHotel,
    hotelDeleteConfirm,
    setHotelDeleteConfirm,
    handleDeleteHotel,
  } = s;

  return (
    <section>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div>
          <h2 className="m-0 text-lg font-bold text-[--gray-800] flex items-center gap-2">
            <Building2 size={18} className="text-[var(--brand-600)]" />{" "}
            {t("hotels")}
          </h2>
          <p className="text-[0.8125rem] text-[var(--gray-500)] mt-0.5">
            {t("hotelCodeDesc")}
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button onClick={openHotelModal}>
            <Plus size={15} strokeWidth={2.5} /> {t("addHotel")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : hotels.length === 0 ? (
        <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[var(--radius-lg)] shadow-sm p-0 overflow-hidden">
          <EmptyState icon={<Building2 size={26} />}>
            <h3 className="text-gray-700">{t("noHotelsAdded")}</h3>
            <p>{t("noHotelsDesc")}</p>
            <Button className="mt-2" onClick={openHotelModal}>
              {t("addFirstHotel")}
            </Button>
          </EmptyState>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
          {hotels.map((hotel) => {
            const roomCount = (roomsByHotel.get(hotel._id) || []).length;
            return (
              <div
                key={hotel._id}
                className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[var(--radius-lg)] shadow-sm p-4.5 flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center min-w-[46px] h-10 px-2.5 rounded-lg bg-[var(--brand-500,#6366f1)] text-white font-bold text-[0.9375rem] tracking-wider shrink-0">
                    {displayCode(hotel)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[--gray-800] text-[0.9375rem] overflow-hidden text-ellipsis whitespace-nowrap">
                      {hotel.name}
                    </div>
                    <div className="text-[0.75rem] text-[var(--gray-400)] mt-0.5 flex items-center gap-1">
                      <MapPin size={12} />{" "}
                      {hotel.location || t("noLocationSet")}
                    </div>
                  </div>
                  {hotelDeleteConfirm === hotel._id ? (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="danger"
                        icon
                        onClick={() => handleDeleteHotel(hotel._id)}
                        aria-label={t("confirmDeleteHotel")}
                      >
                        <Check size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        icon
                        onClick={() => setHotelDeleteConfirm(null)}
                        aria-label={t("cancelDelete")}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        icon
                        onClick={() => openEditHotel(hotel)}
                        title={t("editHotelAria")}
                        aria-label={t("editHotelAria")}
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        icon
                        className="text-[var(--danger)]"
                        onClick={() => setHotelDeleteConfirm(hotel._id)}
                        title={t("deleteHotelAria")}
                        aria-label={t("deleteHotelAria")}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[0.75rem] text-[var(--gray-500)] pt-2.5 border-t border-[var(--surface-border)]">
                  <BedDouble size={13} />
                  <span className="tabular-nums">{roomCount}</span>{" "}
                  {roomCount === 1 ? t("roomLower") : t("roomsLower")}
                  {hotel.roomTypes && hotel.roomTypes.length > 0 && (
                    <div className="ml-auto flex gap-1 items-center">
                      {hotel.roomTypes.slice(0, 3).map((rt) => (
                        <span
                          key={rt}
                          className="bg-[var(--brand-50,#eef2ff)] text-[var(--brand-600,#4f46e5)] px-1.5 py-0.5 rounded-md font-semibold text-[0.68rem]"
                        >
                          {rt}
                        </span>
                      ))}
                      {hotel.roomTypes.length > 3 && (
                        <span>+{hotel.roomTypes.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
