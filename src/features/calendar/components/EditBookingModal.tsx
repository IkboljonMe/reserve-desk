"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  User,
  Phone,
  MapPin,
  Users,
  FileText,
} from "lucide-react";
import { useTranslation } from "@/i18n";
import { getBookings } from "@/lib/api/bookings";
import { generateTimeSlots, slotEnd, toMin } from "@/features/book/utils";
import { hoursForDate } from "@/lib/serviceHours";
import {
  MenuItemsEditor,
  type MenuItem,
} from "@/components/ui/MenuItemsEditor";
import Spinner from "@/components/ui/Spinner";
import Input from "@/components/ui/Input";
import type { Booking } from "@/types";
import type { CalendarPageState } from "../useCalendarPage";
import Button from "@/components/ui/Button";

type DayRow = {
  _id: string;
  startTime: string;
  endTime: string;
  status?: string;
  serviceId: string | { _id: string };
};

import Modal from "@/components/ui/Modal";

export function EditBookingModal({ s }: { s: CalendarPageState }) {
  const { t } = useTranslation();
  const { editBooking: b, setEditBooking, saveBookingEdit, services } = s;

  const service = useMemo(
    () => services.find((sv) => sv._id === b?.serviceId?._id),
    [services, b],
  );
  const duration = b?.duration || 60;

  const [date, setDate] = useState(b?.date ?? "");
  const [startTime, setStartTime] = useState(b?.startTime ?? "");
  const [name, setName] = useState(b?.customerName ?? "");
  const [phone, setPhone] = useState(b?.customerPhone ?? "");
  const [room, setRoom] = useState(b?.roomNumber ?? "");
  const [persons, setPersons] = useState(b?.persons ?? 1);
  const [notes, setNotes] = useState(b?.notes ?? "");
  const [menuItems, setMenuItems] = useState<MenuItem[]>(b?.menuItems ?? []);
  const [menuReadyTime, setMenuReadyTime] = useState(b?.menuReadyTime ?? "");
  const [dayBookings, setDayBookings] = useState<DayRow[]>([]);
  const [saving, setSaving] = useState(false);

  // Load the chosen day's bookings (minus this one) to compute free start times.
  useEffect(() => {
    if (!b || !date || !service?._id) return;
    let alive = true;
    getBookings(date, date)
      .then((data: unknown) => {
        if (!alive) return;
        const rows = Array.isArray(data) ? (data as DayRow[]) : [];
        setDayBookings(
          rows.filter(
            (x) =>
              x._id !== b._id &&
              x.status !== "cancelled" &&
              (typeof x.serviceId === "string"
                ? x.serviceId
                : x.serviceId?._id) === service._id,
          ),
        );
      })
      .catch(() => {
        if (alive) setDayBookings([]);
      });
    return () => {
      alive = false;
    };
  }, [b, date, service?._id]);

  if (!b) return null;

  const bufBefore = service?.bufferTimeBefore || 0;
  const bufAfter = service?.bufferTimeAfter || 0;
  const capacity = service?.capacity || 1;
  const dayHours = service
    ? hoursForDate(service, date)
    : { open: "00:00", close: "23:59", closed: false };
  const allSlots = dayHours.closed
    ? []
    : generateTimeSlots(dayHours.open, dayHours.close, duration);
  const freeSlots = allSlots.filter((slot) => {
    const start = toMin(slot);
    const end = start + duration;
    const overlaps = dayBookings.filter(
      (x) =>
        toMin(x.startTime) < end + bufAfter &&
        toMin(x.endTime) > start - bufBefore,
    ).length;
    return overlaps < capacity;
  });
  // Always keep the booking's current start time selectable (unless the day is
  // closed, in which case nothing is bookable).
  const startOptions = dayHours.closed
    ? []
    : startTime && !freeSlots.includes(startTime)
      ? [startTime, ...freeSlots]
      : freeSlots;

  const endTime = startTime ? slotEnd(startTime, duration) : b.endTime;
  const changed =
    date !== b.date ||
    startTime !== b.startTime ||
    name.trim() !== b.customerName ||
    phone.trim() !== (b.customerPhone || "") ||
    room.trim() !== (b.roomNumber || "") ||
    persons !== (b.persons || 1) ||
    notes.trim() !== (b.notes || "") ||
    JSON.stringify(menuItems) !== JSON.stringify(b.menuItems || []) ||
    menuReadyTime !== (b.menuReadyTime || "");

  const close = () => setEditBooking(null);

  async function save() {
    if (!b || !changed) return;
    setSaving(true);
    await saveBookingEdit(b._id, {
      date,
      startTime,
      endTime,
      customerName: name.trim() || b.customerName,
      customerPhone: phone.trim(),
      roomNumber: room.trim(),
      persons,
      notes: notes.trim(),
      menuItems: menuItems
        .filter((it) => it.name.trim())
        .map((it) => ({ ...it, name: it.name.trim() })),
      menuReadyTime,
    } as Partial<Booking>);
    setSaving(false);
  }

  return (
    <Modal
      open={true}
      onClose={close}
      title={t("editBooking")}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={close}>
            {t("cancel")}
          </Button>
          <Button
            disabled={saving || !changed || !startTime || dayHours.closed}
            onClick={save}
          >
            {saving ? <Spinner size={18} dark={false} /> : null}
            {t("saveChanges")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3.5">
        <div className="flex gap-3">
          <Input
            containerClassName="flex-1"
            label={
              <span className="flex items-center gap-1.25">
                <CalendarDays size={13} /> {t("date")}
              </span>
            }
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight flex items-center gap-1.25">
              <Clock size={13} /> {t("time")}
            </label>
            <select
              className="w-full px-3 py-2 min-h-9.5 rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-(--gray-200,#e5e7eb) text-[--gray-800] hover:border-(--gray-300) focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)] disabled:opacity-50 disabled:bg-(--gray-50)"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={dayHours.closed}
            >
              {startOptions.length === 0 && (
                <option value="">
                  {dayHours.closed
                    ? t("serviceClosedOnDate")
                    : t("noSlotsAvailable")}
                </option>
              )}
              {startOptions.map((slot) => (
                <option key={slot} value={slot}>
                  {slot} – {slotEnd(slot, duration)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label={
            <span className="flex items-center gap-1.25">
              <User size={13} /> {t("guest")}
            </span>
          }
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex gap-3">
          <Input
            containerClassName="flex-1"
            label={
              <span className="flex items-center gap-1.25">
                <Phone size={13} /> {t("phone")}
              </span>
            }
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            containerClassName="flex-1"
            label={
              <span className="flex items-center gap-1.25">
                <MapPin size={13} /> {t("room")}
              </span>
            }
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
        </div>

        <Input
          containerClassName="max-w-40"
          label={
            <span className="flex items-center gap-1.25">
              <Users size={13} /> {t("personsCount")}
            </span>
          }
          type="number"
          min={1}
          step={1}
          value={persons}
          onChange={(e) =>
            setPersons(Math.max(1, parseInt(e.target.value) || 1))
          }
          onFocus={(e) => e.currentTarget.select()}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight flex items-center gap-1.25">
            <FileText size={13} /> {t("notes")}
          </label>
          <textarea
            className="w-full px-3 py-2 min-h-9.5 rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-(--gray-200,#e5e7eb) text-[--gray-800] hover:border-(--gray-300) focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)] resize-y"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <MenuItemsEditor
          items={menuItems}
          onAdd={() =>
            setMenuItems((items) => [...items, { name: "", qty: 1, price: 0 }])
          }
          onUpdate={(i, patch) =>
            setMenuItems((items) =>
              items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
            )
          }
          onRemove={(i) =>
            setMenuItems((items) => items.filter((_, idx) => idx !== i))
          }
          readyTime={menuReadyTime}
          onReadyTimeChange={setMenuReadyTime}
        />
      </div>
    </Modal>
  );
}
