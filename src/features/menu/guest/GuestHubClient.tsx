"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";
import {
  guestFoodPath,
  guestServicesPath,
  rootDomain,
  MENU_LANGS,
  MENU_LANG_LABELS,
} from "@/lib/menu";
import { useGuestPrefs } from "./useGuestPrefs";
import { useTranslation } from "@/i18n";
import type { TileId, ResolvedTile } from "@/lib/tiles";

const LANG_OPTIONS = MENU_LANGS.map((l) => ({
  value: l,
  label: MENU_LANG_LABELS[l],
}));



// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({
  text,
  label,
  copied: copiedLabel,
}: {
  text: string;
  label: string;
  copied: string;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        /* silently ignore */
      });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`text-[0.75rem] px-2.5 py-1 rounded-md border-none cursor-pointer transition-colors ${
        copied
          ? "bg-emerald-500/20 text-emerald-400"
          : "bg-(--gray-100) text-[--gray-600]"
      }`}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function HubModal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-200 bg-black/72 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-(--surface-card) rounded-t-xl px-6 pt-7 pb-9 animate-[hubSlideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
      <style>{`@keyframes hubSlideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

const MODAL_CLOSE_BTN =
  "w-full p-3 rounded-xl border-none bg-(--gray-100) text-[--gray-600] text-[0.9rem] font-semibold cursor-pointer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GuestHubProps {
  hotelName: string;
  hotelSlug: string;
  logoUrl: string;
  bannerUrl: string;
  room: string;
  locale: string;
  tiles: ResolvedTile[];
  wifiName: string;
  wifiPassword: string;
  instagramUrl: string;
  telegramUrl: string;
  receptionPhone: string;
  reviewUrl: string;
  isMenuSub?: boolean;
}

// ─── Main component ────────────────────────────────────────────────────────────

export function GuestHubClient({
  hotelName,
  hotelSlug,
  logoUrl,
  bannerUrl,
  room,
  locale,
  tiles,
  wifiName,
  wifiPassword,
  instagramUrl,
  telegramUrl,
  receptionPhone,
  reviewUrl,
  isMenuSub = false,
}: GuestHubProps) {
  const router = useRouter();

  const { lang, setLang, theme, toggleTheme, themeVars } =
    useGuestPrefs(locale);
  const { t } = useTranslation();
  const hubLang = (lang === "uz" || lang === "ru" ? lang : "en") as "uz" | "ru" | "en";
  const [modal, setModal] = useState<TileId | null>(null);
  const [problem, setProblem] = useState("");
  const [problemStatus, setProblemStatus] = useState<
    "idle" | "sending" | "sent"
  >("idle");
  // Marketing homepage link — relative during SSR, upgraded to the absolute
  // root-domain URL after mount (this page is served from menu./demo.
  // subdomains, so a plain `/<locale>` link would stay on the wrong host).
  const [joinHref, setJoinHref] = useState(`/${locale}`);

  useEffect(() => {
    setJoinHref(
      `${window.location.protocol}//${rootDomain(window.location.host)}/${locale}`,
    );
  }, [locale]);


  const closeModal = useCallback(() => {
    setModal(null);
    setProblem("");
    setProblemStatus("idle");
  }, []);

  const enabledTiles = tiles.filter((t) => t.enabled);

  // Path-based food page on the menu subdomain (same-origin nav). The URL's own
  // locale segment stays fixed (chrome text is server-rendered per-request) —
  // the guest's 10-language content pick travels via useGuestPrefs, not the URL.
  const menuFoodHref = guestFoodPath(locale, hotelSlug, room, isMenuSub);

  const handleTileClick = (id: TileId) => {
    if (id === "menu") {
      router.push(menuFoodHref);
      return;
    }
    if (id === "services") {
      router.push(guestServicesPath(locale, hotelSlug, room, isMenuSub));
      return;
    }
    if (id === "reviews" && reviewUrl) {
      window.open(reviewUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setModal(id);
  };

  const handleProblemSubmit = async () => {
    if (!problem.trim()) return;
    setProblemStatus("sending");
    try {
      await fetch("/api/menu/guest/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotel: hotelSlug, room, message: problem }),
      });
    } catch {
      /* best-effort */
    }
    setProblemStatus("sent");
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-dvh bg-[--surface-bg] text-[--gray-800]"
      style={{ fontFamily: "'Inter',system-ui,sans-serif", ...themeVars }}
    >
      <div className="max-w-md mx-auto">
        {/* ── Banner ─────────────────────────────────────────────── */}
        <div className="relative h-55 shrink-0">
          {/* Image + gradient live in their own clipped layer — the top
            controls below are a sibling, NOT a descendant of overflow-hidden,
            so the language dropdown's popup list can escape the banner's
            bounds instead of being clipped at its bottom edge. */}
          <div className="absolute inset-0 overflow-hidden">
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)]" />
            )}
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.3)_0%,rgba(12,12,14,0.85)_100%)]" />
          </div>

          {/* Top controls — items-stretch so every control matches whatever
            height the Dropdown (a shared, fixed-internal-padding component)
            actually renders at, instead of guessing a px value that has to
            stay in sync with it. */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-stretch justify-between gap-2">
            {/* Room badge */}
            {room ? (
              <div className="bg-black/60 backdrop-blur-md border border-white/18 rounded-full px-3.5 text-[0.85rem] font-bold text-white flex items-center gap-1.5 shrink-0">
                <span className="text-white/50 font-normal">{t("hubRoom")}:</span>
                <span className="text-white">{room}</span>
              </div>
            ) : (
              <span />
            )}

            {/* Language + theme */}
            <div className="flex items-stretch gap-1.5">
              <div className="w-29.5">
                <Dropdown
                  value={lang}
                  onChange={(v) => setLang(v as typeof lang)}
                  options={LANG_OPTIONS}
                  ariaLabel="Language"
                />
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="w-10 rounded-[10px] bg-black/45 backdrop-blur-md border border-white/10 flex items-center justify-center text-white cursor-pointer shrink-0"
              >
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Hotel Identity ─────────────────────────────────────── */}
        <div className="flex items-center gap-3.5 px-5 pt-5 pb-2">
          <div
            className={`w-15 h-15 rounded-full shrink-0 border-[2.5px] border-(--gray-300) overflow-hidden flex items-center justify-center ${logoUrl ? "bg-white" : "bg-[linear-gradient(135deg,#4f6ef7,#7c3aed)]"}`}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={hotelName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-[1.4rem] font-extrabold">
                {hotelName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h1 className="m-0 text-[1.25rem] font-extrabold text-(--gray-900) leading-tight">
            {hotelName}
          </h1>
        </div>

        {/* ── Tile Grid ──────────────────────────────────────────── */}
        <div className="px-4 pb-6 pt-8 grid grid-cols-2 gap-x-3 gap-y-10">
          {enabledTiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => handleTileClick(tile.id)}
              className="bg-(--surface-card) border border-(--surface-border) shadow-[0_8px_24px_rgba(0,0,0,0.15)] rounded-xl px-3 pb-4 flex flex-col items-center gap-2 cursor-pointer text-center transition-all duration-200 active:scale-[0.96] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)] hover:-translate-y-1 [-webkit-tap-highlight-color:transparent]"
            >
              <img
                src={tile.icon}
                alt=""
                className="w-24 h-24 -mt-8 block mx-auto object-contain drop-shadow-[0_12px_16px_rgba(0,0,0,0.3)]"
              />
              <span className="text-[0.88rem] font-bold text-[--gray-800] leading-snug">
                {tile.label[hubLang] || tile.label.uz}
              </span>
            </button>
          ))}
        </div>

        {/* ── Social links ───────────────────────────────────────── */}
        {(instagramUrl || telegramUrl) && (
          <div className="text-center px-5 pt-4 pb-2">
            <p className="mb-3 text-[0.78rem] text-(--gray-400) tracking-wide">
              {t("hubFollowUs")}
            </p>
            <div className="flex justify-center gap-4">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full bg-(--gray-100) border border-(--surface-border) flex items-center justify-center no-underline transition-colors"
                >
                  {/* Instagram SVG */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="5"
                      stroke="url(#ig)"
                      strokeWidth="2"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="4"
                      stroke="url(#ig2)"
                      strokeWidth="2"
                    />
                    <circle cx="17.5" cy="6.5" r="1" fill="#e1306c" />
                    <defs>
                      <linearGradient
                        id="ig"
                        x1="2"
                        y1="2"
                        x2="22"
                        y2="22"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#f9ce34" />
                        <stop offset="0.5" stopColor="#ee2a7b" />
                        <stop offset="1" stopColor="#6228d7" />
                      </linearGradient>
                      <linearGradient
                        id="ig2"
                        x1="8"
                        y1="8"
                        x2="16"
                        y2="16"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#f9ce34" />
                        <stop offset="0.5" stopColor="#ee2a7b" />
                        <stop offset="1" stopColor="#6228d7" />
                      </linearGradient>
                    </defs>
                  </svg>
                </a>
              )}
              {telegramUrl && (
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full bg-(--gray-100) border border-(--surface-border) flex items-center justify-center no-underline"
                >
                  {/* Telegram SVG */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22 2L11 13"
                      stroke="#2AABEE"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M22 2L15 22L11 13L2 9L22 2Z"
                      stroke="#2AABEE"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── Footer branding ────────────────────────────────────── */}
        <div className="text-center px-5 pt-5 pb-10">
          <p className="mb-1 text-[0.75rem] text-(--gray-300)">
            {t("hubIsYourProperty")}
          </p>
          <a
            href={joinHref}
            className="text-[0.8rem] font-bold tracking-wide no-underline text-[rgba(245,166,35,0.9)]"
          >
            {t("hubJoinFree")}
          </a>
        </div>
      </div>

      {/* ── Modals (viewport-fixed — deliberately outside the 448px column) ── */}

      {/* Wi-Fi modal */}
      <HubModal open={modal === "wifi"} onClose={closeModal}>
        <div className="text-center mb-5">
          <img
            src="/assets/menu-icons/wifi.png"
            alt=""
            className="w-11 h-11 block mx-auto object-contain mb-2"
          />
          <h2 className="mt-2 mb-0 text-[1.1rem] font-bold text-(--gray-900)">
            Wi-Fi
          </h2>
        </div>
        {wifiName && (
          <div className="bg-(--gray-50) rounded-xl py-3 px-4 mb-2.5 flex items-center justify-between gap-2">
            <div>
              <p className="text-[0.8rem] text-(--gray-500) m-0 mt-0.5">
                {t("hubRoom")} {room}
              </p>
              <p className="m-0 text-[0.95rem] font-semibold text-(--gray-900)">
                {wifiName}
              </p>
            </div>
            <CopyButton
              text={wifiName}
              label={t("hubCopy")}
              copied={t("hubCopied")}
            />
          </div>
        )}
        {wifiPassword && (
          <div className="bg-(--gray-50) rounded-xl py-3 px-4 mb-5 flex items-center justify-between gap-2">
            <div>
              <p className="m-0 text-[0.7rem] text-(--gray-400)">
                {t("hubWifiPassword")}
              </p>
              <p className="m-0 text-[0.95rem] font-semibold text-(--gray-900)">
                {wifiPassword}
              </p>
            </div>
            <CopyButton
              text={wifiPassword}
              label={t("hubCopy")}
              copied={t("hubCopied")}
            />
          </div>
        )}
        <button type="button" onClick={closeModal} className={MODAL_CLOSE_BTN}>
          {t("hubClose")}
        </button>
      </HubModal>

      {/* Problem report modal */}
      <HubModal open={modal === "problem"} onClose={closeModal}>
        <div className="text-center mb-5">
          <img
            src="/assets/menu-icons/report.png"
            alt=""
            className="w-11 h-11 block mx-auto object-contain mb-2"
          />
          <h2 className="mt-2 mb-0 text-[1.1rem] font-bold text-(--gray-900)">
            {t("hubReportProblem")}
          </h2>
        </div>
        {problemStatus === "sent" ? (
          <p className="text-center text-emerald-400 font-semibold text-base mb-5">
            {t("hubSent")}
          </p>
        ) : (
          <>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder={t("hubProblemPlaceholder")}
              rows={4}
              className="w-full box-border rounded-xl p-3 mb-3 bg-(--gray-50) border border-(--surface-border) text-(--gray-900) text-[0.9rem] resize-none outline-none"
            />
            <button
              type="button"
              disabled={problemStatus === "sending" || !problem.trim()}
              onClick={handleProblemSubmit}
              className={`w-full p-3 rounded-xl border-none text-white text-[0.9rem] font-bold mb-2.5 ${problem.trim() ? "bg-(--brand-500) cursor-pointer" : "bg-(--brand-500)/35 cursor-default"}`}
            >
              {problemStatus === "sending" ? t("hubSending") : t("hubSend")}
            </button>
          </>
        )}
        <button type="button" onClick={closeModal} className={MODAL_CLOSE_BTN}>
          {t("hubClose")}
        </button>
      </HubModal>

      {/* Reception / contact modal (alarm, taxi, services, reception) */}
      <HubModal
        open={
          modal === "alarm" ||
          modal === "taxi" ||
          modal === "services" ||
          modal === "reception" ||
          modal === "reviews"
        }
        onClose={closeModal}
      >
        <div className="text-center mb-5">
          {modal && (
            <img
              src={
                tiles.find((t) => t.id === modal)?.icon ||
                "/assets/menu-icons/reception.png"
              }
              alt=""
              className="w-11 h-11 block mx-auto object-contain mb-2"
            />
          )}
          <h2 className="mt-2 mb-0 text-[1.1rem] font-bold text-(--gray-900)">
            {modal
              ? tiles.find((t) => t.id === modal)?.label[hubLang] || ""
              : ""}
          </h2>
        </div>
        <p className="text-center text-(--gray-500) text-[0.9rem] mb-5 leading-relaxed">
          {t("hubContactReceptionDesc")}
        </p>
        {receptionPhone && (
          <a
            href={`tel:${receptionPhone}`}
            className="block text-center py-3.5 rounded-xl bg-[rgba(79,110,247,0.2)] border border-[rgba(79,110,247,0.4)] text-[#8ea2ff] no-underline font-bold text-base mb-2.5"
          >
            📞 {receptionPhone}
          </a>
        )}
        <button type="button" onClick={closeModal} className={MODAL_CLOSE_BTN}>
          {t("hubClose")}
        </button>
      </HubModal>
    </div>
  );
}
