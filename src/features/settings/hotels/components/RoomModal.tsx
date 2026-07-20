"use client";

import { Building2 } from "lucide-react";
import { useTranslation } from "@/i18n";
import Select from "@/components/Select";
import Spinner from "@/components/ui/Spinner";
import { displayCode } from "../utils";
import type { HotelsRoomsPageState } from "../useHotelsRoomsPage";
import Button from "@/components/ui/Button";

export function RoomModal({ s }: { s: HotelsRoomsPageState }) {
  const { t } = useTranslation();
  const {
    roomOpen,
    setRoomOpen,
    editRoomId,
    handleSubmitRoom,
    roomForm,
    setRoomForm,
    hotels,
    hotelById,
    roomHotel,
    roomShort,
    savingRoom,
  } = s;
  if (!roomOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setRoomOpen(false)}>
      <div className="modal max-w-[440px]" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editRoomId ? t("editRoom") : t("addRoom")}</h2>
          <Button
            variant="ghost"
            icon
            onClick={() => setRoomOpen(false)}
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
        <form onSubmit={handleSubmitRoom}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">
                {t("hotel")} *
              </label>
              <Select
                ariaLabel={t("hotel")}
                placeholder={t("selectHotel")}
                icon={<Building2 size={16} />}
                value={roomForm.hotelId}
                onChange={(v) => {
                  const h = hotelById.get(v);
                  setRoomForm((f) => ({
                    ...f,
                    hotelId: v,
                    type: h?.roomTypes?.[0] || "",
                  }));
                }}
                options={hotels.map((h) => ({
                  value: h._id,
                  label: `${displayCode(h)} · ${h.name}`,
                }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">
                  {t("floor")} *
                </label>
                <input
                  className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[--gray-800] hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
                  type="number"
                  min={0}
                  required
                  value={roomForm.floor}
                  onChange={(e) =>
                    setRoomForm((f) => ({
                      ...f,
                      floor: parseInt(e.target.value) || 1,
                    }))
                  }
                  placeholder="2"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">
                  {t("roomNumberField")} *
                </label>
                <input
                  className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[--gray-800] hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
                  required
                  value={roomForm.number}
                  onChange={(e) =>
                    setRoomForm((f) => ({ ...f, number: e.target.value }))
                  }
                  placeholder="202"
                />
              </div>
            </div>

            {roomHotel &&
              roomHotel.roomTypes &&
              roomHotel.roomTypes.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">
                    {t("category")}
                  </label>
                  <Select
                    ariaLabel={t("roomCategoryAria")}
                    placeholder={t("selectCategory")}
                    value={roomForm.type}
                    onChange={(v) => setRoomForm((f) => ({ ...f, type: v }))}
                    options={roomHotel.roomTypes.map((rt) => ({
                      value: rt,
                      label: rt,
                    }))}
                  />
                </div>
              )}

            {/* Live preview of the generated room name */}
            <div className="bg-[var(--brand-50,#eef2ff)] border border-[var(--brand-100,#e0e7ff)] rounded-lg p-[10px_14px] text-[0.8125rem] text-[var(--brand-700,#4338ca)] flex items-center gap-2">
              {t("roomNameLabel")}&nbsp;
              <strong className="text-[0.9375rem] font-bold tabular-nums">
                {roomShort}-{roomForm.number || "###"}
              </strong>
            </div>
          </div>
          <div className="h-px bg-surface-border my-4" />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRoomOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={savingRoom}>
              {savingRoom ? <Spinner size={18} dark={false} /> : null}
              {savingRoom ? t("saving") : editRoomId ? t("save") : t("addRoom")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
