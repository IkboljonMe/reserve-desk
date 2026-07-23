"use client";

import {
  Layers,
  Trash2,
  Plus,
  DoorClosed,
  TriangleAlert,
  Check,
  X,
  BedDouble,
  Pencil,
  GripVertical,
  Building2,
} from "lucide-react";
import { useTranslation } from "@/i18n";
import Select from "@/components/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { displayCode } from "../utils";
import type { HotelsRoomsPageState } from "../useHotelsRoomsPage";
import Button from "@/components/ui/Button";

export function RoomsSection({ s }: { s: HotelsRoomsPageState }) {
  const { t } = useTranslation();
  const {
    hotels,
    rooms,
    loading,
    openRoomModal,
    roomsByHotel,
    unassignedRooms,
    hasAnyGroupedRooms,
    assignRoomToHotel,
    handleDeleteRoom,
    openEditRoom,
    roomDeleteConfirm,
    setRoomDeleteConfirm,
    draggingRoomId,
    setDraggingRoomId,
    handleRoomDragOver,
    handleRoomDrop,
  } = s;

  return (
    <section>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div>
          <h2 className="m-0 text-lg font-bold text-[--gray-800] flex items-center gap-2">
            <BedDouble size={18} className="text-(--brand-600)" />{" "}
            {t("rooms")}
          </h2>
          <p className="text-[0.8125rem] text-[--gray-500] mt-0.5">
            {t("roomsSectionDesc")}
          </p>
        </div>
        <Button onClick={openRoomModal}>
          <Plus size={15} strokeWidth={2.5} /> {t("addRoom")}
        </Button>
      </div>

      {loading ? null : rooms.length === 0 ? (
        <div className="bg-(--surface-card) border border-(--surface-border) rounded-(--radius-lg) shadow-sm p-0 overflow-hidden">
          <EmptyState icon={<BedDouble size={26} />}>
            <h3 className="text-gray-700">{t("noRoomsAdded")}</h3>
            <p>{t("noRoomsDesc")}</p>
            <Button className="mt-2" onClick={openRoomModal}>
              {t("addFirstRoom")}
            </Button>
          </EmptyState>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Unassigned rooms — visible so nothing is ever hidden, with a repair control */}
          {unassignedRooms.length > 0 && (
            <div className="bg-(--surface-card) border border-amber-300 rounded-(--radius-lg) shadow-sm p-0 overflow-hidden">
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                <TriangleAlert
                  size={16}
                  className="text-(--warning,#f59e0b) shrink-0"
                />
                <div>
                  <div className="font-bold text-[0.8125rem] text-amber-800">
                    {t("unassignedRoomsCount", {
                      count: unassignedRooms.length,
                    })}
                  </div>
                  <div className="text-[0.72rem] text-amber-700">
                    {t("unassignedHint")}
                  </div>
                </div>
              </div>
              {unassignedRooms.map((room) => (
                <div
                  key={room._id}
                  className="flex items-center gap-2.5 px-5 py-3 border-b border-(--gray-100,#f3f4f6) last:border-0"
                >
                  <span className="font-bold text-[--gray-800] text-[0.9375rem] min-w-15 tabular-nums">
                    #{room.number}
                  </span>
                  <span className="text-[0.72rem] text-(--gray-400)">
                    {t("floor")} {room.floor}
                  </span>
                  <div className="flex-1 max-w-65">
                    <Select
                      ariaLabel={t("assignRoomAria", { number: room.number })}
                      placeholder={t("assignToHotel")}
                      icon={<Building2 size={15} />}
                      value=""
                      onChange={(v) => assignRoomToHotel(room._id, v)}
                      options={hotels.map((h) => ({
                        value: h._id,
                        label: `${displayCode(h)} · ${h.name}`,
                      }))}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    icon
                    className="text-(--danger)"
                    onClick={() => handleDeleteRoom(room._id)}
                    title={t("deleteRoomAria")}
                    aria-label={t("deleteRoomAria")}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {hotels
            .filter((h) => (roomsByHotel.get(h._id) || []).length > 0)
            .map((hotel) => {
              const hotelRooms = roomsByHotel.get(hotel._id) || [];
              const floors = Array.from(
                new Set(hotelRooms.map((r) => r.floor)),
              ).sort((a, b) => a - b);
              return (
                <div
                  key={hotel._id}
                  className="bg-(--surface-card) border border-(--surface-border) rounded-(--radius-lg) shadow-sm p-0 overflow-hidden"
                >
                  <div className="px-5 py-3 bg-(--gray-50,#f9fafb) border-b border-(--gray-200,#e5e7eb) flex items-center gap-2.5">
                    <span className="inline-flex items-center justify-center min-w-10 h-6.5 px-2 rounded-md bg-(--brand-500,#6366f1) text-white font-bold text-[0.75rem] tracking-wide shrink-0">
                      {displayCode(hotel)}
                    </span>
                    <span className="font-semibold text-[0.8125rem] text-(--gray-700)">
                      {hotel.name}
                    </span>
                    <span className="ml-auto text-[0.72rem] text-(--gray-400) tabular-nums">
                      {hotelRooms.length}{" "}
                      {hotelRooms.length === 1
                        ? t("roomLower")
                        : t("roomsLower")}
                    </span>
                  </div>
                  {floors.map((floor) => (
                    <div key={floor}>
                      <div className="px-5 py-1.5 bg-white text-[0.68rem] font-bold text-(--gray-400) tracking-wider uppercase border-b border-(--gray-100,#f3f4f6) flex items-center gap-1.5">
                        <Layers size={11} /> {t("floor")} {floor}
                      </div>
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-px bg-(--gray-200,#e5e7eb)">
                        {hotelRooms
                          .filter((r) => r.floor === floor)
                          .map((room) => {
                            const isDragging = draggingRoomId === room._id;
                            return (
                              <div
                                key={room._id}
                                onDragOver={(e) => handleRoomDragOver(e, room)}
                                onDrop={() =>
                                  handleRoomDrop(room.hotelId, room.floor)
                                }
                                className={`bg-white p-3.5 flex items-center justify-between gap-2 transition-opacity duration-150 ${
                                  isDragging ? "opacity-40" : "opacity-100"
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span
                                    draggable
                                    onDragStart={(e) => {
                                      setDraggingRoomId(room._id);
                                      e.dataTransfer.effectAllowed = "move";
                                      e.dataTransfer.setData(
                                        "text/plain",
                                        room._id,
                                      );
                                    }}
                                    onDragEnd={() => setDraggingRoomId(null)}
                                    title={t("dragToReorder")}
                                    aria-label={t("dragToReorderRoom")}
                                    className="inline-flex items-center text-(--gray-300,#d1d5db) cursor-grab shrink-0 touch-none hover:text-(--gray-400)"
                                  >
                                    <GripVertical size={16} />
                                  </span>
                                  <span className="inline-flex items-center justify-center w-7.5 h-7.5 rounded-lg shrink-0 bg-(--brand-50,#eef2ff) text-(--brand-600,#4f46e5)">
                                    <DoorClosed size={16} />
                                  </span>
                                  <div className="min-w-0 overflow-hidden">
                                    <div className="font-bold text-[--gray-800] text-[0.9375rem] whitespace-nowrap overflow-hidden text-ellipsis tabular-nums">
                                      {displayCode(hotel)}-{room.number}
                                      {room.type && (
                                        <span className="ml-2 text-[0.7rem] font-semibold text-(--brand-600,#4f46e5) bg-(--brand-50,#eef2ff) px-1.5 py-0.5 rounded-md inline-block align-middle">
                                          {room.type}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {roomDeleteConfirm === room._id ? (
                                  <div className="flex gap-1 shrink-0">
                                    <Button
                                      variant="danger"
                                      icon
                                      onClick={() => handleDeleteRoom(room._id)}
                                      aria-label={t("confirmDeleteRoom")}
                                    >
                                      <Check size={14} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      icon
                                      onClick={() => setRoomDeleteConfirm(null)}
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
                                      onClick={() => openEditRoom(room)}
                                      title={t("editRoomAria")}
                                      aria-label={t("editRoomAria")}
                                    >
                                      <Pencil size={14} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      icon
                                      className="text-(--danger)"
                                      onClick={() =>
                                        setRoomDeleteConfirm(room._id)
                                      }
                                      title={t("deleteRoomAria")}
                                      aria-label={t("deleteRoomAria")}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

          {/* All rooms are unassigned — nudge toward assigning them */}
          {!hasAnyGroupedRooms && unassignedRooms.length > 0 && (
            <p className="text-[0.8125rem] text-(--gray-400) text-center p-2">
              {t("assignRoomsAboveHint")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
