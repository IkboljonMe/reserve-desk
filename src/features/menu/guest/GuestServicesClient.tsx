"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles, Plus, Sun, Moon } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import {
  localized,
  guestHubPath,
  MENU_LANGS,
  MENU_LANG_LABELS,
} from "@/lib/menu";
import { money } from "@/lib/bookingHelpers";
import { useGuestPrefs } from "./useGuestPrefs";

export interface GuestServiceLabels {
  room: string;
  roomNumber: string;
  guestNamePlaceholder: string;
  orderNotePlaceholder: string;
  bookService: string;
  sending: string;
  requestSent: string;
  requestSentDesc: string;
  close: string;
  backToHub: string;
  sum: string;
  noServices: string;
  bookNow: string;
  errorFailed: string;
  errorRoomRequired: string;
}

export interface GuestServiceDto {
  _id: string;
  name: string;
  description: string;
  nameI18n?: Record<string, string>;
  descI18n?: Record<string, string>;
  imageUrl: string;
  price: number;
}

const FIELD =
  "w-full px-3 py-2 min-h-[42px] rounded-lg text-sm outline-none bg-(--surface-card) border border-(--surface-border) text-[--gray-800] focus:border-[var(--brand-500)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]";
const LANG_OPTIONS = MENU_LANGS.map((l) => ({
  value: l,
  label: MENU_LANG_LABELS[l],
}));

export function GuestServicesClient({
  labels,
  locale,
  hotelName,
  hotelSlug,
  room,
  services,
  isMenuSub = false,
}: {
  labels: GuestServiceLabels;
  locale: string;
  hotelName: string;
  hotelSlug: string;
  room: string;
  services: GuestServiceDto[];
  isMenuSub?: boolean;
}) {
  const {
    lang: contentLang,
    setLang: setContentLang,
    theme,
    toggleTheme,
    themeVars,
  } = useGuestPrefs(locale);

  const [selectedService, setSelectedService] =
    useState<GuestServiceDto | null>(null);
  const [roomNumber, setRoomNumber] = useState(room);
  const [guestName, setGuestName] = useState("");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function submitRequest() {
    if (!selectedService) return;
    if (!roomNumber.trim()) {
      setError(labels.errorRoomRequired);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/menu/guest/services/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotel: hotelSlug,
          room: roomNumber.trim(),
          guestName,
          note,
          serviceId: selectedService._id,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setSuccess(true);
    } catch {
      setError(labels.errorFailed);
    } finally {
      setSubmitting(false);
    }
  }

  function closeModal() {
    setSelectedService(null);
    setSuccess(false);
    setError("");
    setNote("");
  }

  return (
    <div
      className="min-h-dvh bg-[--surface-bg] text-[--gray-900] pb-12"
      style={themeVars}
    >
      <header className="sticky top-0 z-10 max-w-md mx-auto bg-(--surface-card) border-b border-(--surface-border) px-4 py-3 flex items-stretch justify-between gap-3 shadow-sm">
        <div className="min-w-0 flex items-stretch gap-2.5">
          <a
            href={guestHubPath(locale, hotelSlug, room, isMenuSub)}
            aria-label={labels.backToHub}
            className="w-10 rounded-lg bg-(--gray-100) text-(--gray-700) flex items-center justify-center shrink-0"
          >
            <ArrowLeft size={16} />
          </a>
          <div className="min-w-0 flex flex-col justify-center">
            <h1 className="text-[1.05rem] font-extrabold truncate m-0">
              {hotelName}
            </h1>
            {room && (
              <p className="text-[0.8rem] text-(--gray-500) m-0 mt-0.5">
                {labels.room} {room}
              </p>
            )}
          </div>
        </div>
        <nav className="flex items-stretch gap-1.5 shrink-0">
          <div className="w-29.5">
            <Dropdown
              value={contentLang}
              onChange={(v) => setContentLang(v as typeof contentLang)}
              options={LANG_OPTIONS}
              ariaLabel="Language"
            />
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-10 rounded-lg bg-(--gray-100) text-(--gray-700) flex items-center justify-center shrink-0"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </nav>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 flex flex-col gap-5">
        {services.length === 0 ? (
          <p className="text-center text-(--gray-400) text-sm py-16">
            {labels.noServices}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {services.map((s) => {
              const name = localized(s.nameI18n, s.name, contentLang);
              const desc = localized(s.descI18n, s.description, contentLang);
              return (
                <div
                  key={s._id}
                  className="bg-(--surface-card) border border-(--surface-border) rounded-2xl overflow-hidden shadow-sm flex flex-col"
                >
                  {s.imageUrl && (
                    <img
                      src={s.imageUrl}
                      alt=""
                      className="w-full h-44 object-cover"
                    />
                  )}
                  <div className="p-4 flex flex-col gap-2">
                    <h3 className="font-extrabold text-[1.1rem] text-[--gray-800] m-0">
                      {name}
                    </h3>
                    {desc && (
                      <p className="text-[0.85rem] text-(--gray-500) m-0 leading-snug">
                        {desc}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="font-extrabold text-[1.05rem] text-(--brand-600) tabular-nums">
                        {s.price > 0 ? `${money(s.price)} ${labels.sum}` : ""}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setSelectedService(s)}
                        leftIcon={<Sparkles size={14} strokeWidth={2.5} />}
                      >
                        {labels.bookNow}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Modal
        open={!!selectedService}
        onClose={closeModal}
        title={success ? labels.requestSent : labels.bookService}
        size="sm"
        closeLabel={labels.close}
        footer={
          success ? (
            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={closeModal}
            >
              {labels.close}
            </Button>
          ) : (
            <Button
              className="w-full justify-center"
              loading={submitting}
              onClick={submitRequest}
            >
              {submitting ? labels.sending : labels.bookNow}
            </Button>
          )
        }
      >
        {success ? (
          <div className="py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={32} />
            </div>
            <p className="text-lg font-bold text-(--gray-800) mb-2 m-0">
              {labels.requestSent}
            </p>
            <p className="text-sm text-(--gray-500) m-0">
              {labels.requestSentDesc}
            </p>
          </div>
        ) : selectedService ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-(--surface-border) bg-[--surface-bg] p-3">
              <div className="font-bold text-[0.95rem] text-[--gray-800]">
                {localized(
                  selectedService.nameI18n,
                  selectedService.name,
                  contentLang,
                )}
              </div>
              {selectedService.price > 0 && (
                <div className="text-[0.85rem] text-(--gray-500) mt-0.5 tabular-nums">
                  {money(selectedService.price)} {labels.sum}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              <input
                className={FIELD}
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder={labels.roomNumber}
              />
              <input
                className={FIELD}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder={labels.guestNamePlaceholder}
              />
              <textarea
                className={`${FIELD} resize-y min-h-17.5`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={labels.orderNotePlaceholder}
              />
              {error && (
                <p className="text-[0.8rem] text-(--color-danger) font-medium m-0">
                  {error}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
