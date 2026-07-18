"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation, LANGUAGES, LanguageCode } from "@/i18n";
import { useState, useEffect, useCallback } from "react";
import { useBookingModal } from "@/components/BookingModalProvider";
import { BrandMark } from "@/components/BrandMark";
import { useTheme } from "@/components/ThemeProvider";
import type { SessionRole } from "@/lib/session";
import type { FeatureKey } from "@/lib/planFeatures";

// Which plan feature (if any) gates each nav item's href. Items not listed
// here (dashboard, settings) are core and always visible.
const NAV_FEATURE_GATE: Record<string, FeatureKey> = {
  "/calendar": "calendar",
  "/book": "calendar",
  "/clients": "clients",
  "/contracts": "contracts",
  "/menu": "menu",
  "/orders": "menu",
  "/notifications": "notifications",
};

export default function Sidebar({
  collapsed = false,
  role = "admin",
  basePath,
  onToggle,
  userName = "",
  userEmail = "",
  hotelName = "",
  mobile = false,
  mobileOpen = false,
  onCloseMobile,
  planFeatures,
}: {
  collapsed?: boolean;
  role?: SessionRole;
  // Locale-less area prefix, e.g. '/secure/company/x' or
  // '/secure/company/x/admin/y' — every nav href hangs off it.
  basePath: string;
  onToggle?: () => void;
  userName?: string;
  userEmail?: string;
  hotelName?: string;
  mobile?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  // The tenant's plan's enabled feature keys. `undefined` means "don't gate"
  // (e.g. a plan lookup failure shouldn't lock an owner out of their own app).
  planFeatures?: FeatureKey[];
}) {
  const pathname = usePathname();
  const { t, lang, setLang } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { openBookingModal } = useBookingModal();
  const [notifCount, setNotifCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  useEffect(() => {
    if (pathname.includes("/settings")) {
      setSettingsExpanded(true);
    }
  }, [pathname]);

  // Prefix an app path with the active locale + area base path, e.g.
  // '/calendar' -> '/uz/secure/company/safir-group-mchj/calendar'.
  const localized = (href: string) => `/${lang}${basePath}${href}`;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore — navigate to login regardless so the user isn't stuck */
    }
    // Hard navigation (not router.push): forces a fresh request so the cleared
    // session cookie takes effect and the middleware re-runs, landing cleanly on
    // the login page. On a subdomain basePath is '' → /{lang}/login (the portal
    // login); on the root domain it's the tenant's /secure/company/{slug}/login.
    window.location.assign(`/${lang}${basePath}/login`);
  }

  // Owner has no single hotel; admins are scoped to one. Show whichever applies
  // as the account's context line under the name.
  const accountContext =
    role === "owner" ? t("owner") : hotelName || t("hotelAdmin");

  const loadNotifCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifCount(typeof data.count === "number" ? data.count : 0);
    } catch {
      /* silent — badge is non-critical */
    }
  }, []);

  // Refresh the badge on navigation and whenever a reminder is dismissed.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadNotifCount();
  }, [loadNotifCount, pathname]);
  useEffect(() => {
    const handler = () => loadNotifCount();
    window.addEventListener("notifications-updated", handler);
    return () => window.removeEventListener("notifications-updated", handler);
  }, [loadNotifCount]);

  const NAV_ITEMS = [
    {
      label: t("dashboard"),
      href: "/dashboard",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      label: t("calendar"),
      href: "/calendar",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      label: t("newBooking"),
      href: "/book",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      ),
    },
    {
      label: t("clients"),
      href: "/clients",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: t("contracts"),
      href: "/contracts",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8M16 17H8M10 9H8" />
        </svg>
      ),
    },
    {
      label: t("menu"),
      href: "/menu",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 11h18" />
          <path d="M12 11V3" />
          <path d="M7 11a5 5 0 0 1 10 0" />
          <path d="M5 15h14a2 2 0 0 1 2 2 4 4 0 0 1-4 4H7a4 4 0 0 1-4-4 2 2 0 0 1 2-2z" />
        </svg>
      ),
    },
    {
      label: t("orders"),
      href: "/orders",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      label: t("notifications"),
      href: "/notifications",
      badge: notifCount,
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
    {
      label: t("settings"),
      href: "/settings",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
      children: [
        { label: t("admins"), href: "/settings/admins" },
        { label: t("services"), href: "/settings/services" },
        { label: t("hotelsAndRooms"), href: "/settings/hotels" },
        { label: t("clientGroups"), href: "/settings/client-groups" },
        { label: t("telegram"), href: "/settings/telegram" },
      ],
    },
  ];

  // The owner sees everything (all hotels + Settings); admins get every
  // operational item but Settings. Then filter out anything the company's
  // plan doesn't include (dashboard/settings are core and never gated).
  const visibleItems = (
    role === "owner"
      ? NAV_ITEMS
      : NAV_ITEMS.filter((item) => item.href !== "/settings")
  ).filter((item) => {
    const gate = NAV_FEATURE_GATE[item.href];
    return !gate || !planFeatures || planFeatures.includes(gate);
  });

  return (
    <aside
      style={{ background: "var(--sidebar-bg)" }}
      className={
        mobile
          ? `fixed inset-y-0 left-0 w-58 min-w-58 z-150 flex flex-col overflow-hidden transition-transform duration-240 ease-in-out ${mobileOpen ? "translate-x-0 shadow-[8px_0_30px_rgba(0,0,0,0.25)]" : "-translate-x-full"}`
          : `flex flex-col overflow-hidden border-r border-white/8 transition-[width,min-width] duration-240 ease-in-out ${collapsed ? "w-18 min-w-18" : "w-58 min-w-58"}`
      }
    >
      {/* Brand */}
      <div
        className={`border-b border-white/6 transition-[padding] duration-240 ease-in-out ${collapsed ? "py-6 px-0 pb-[1.35rem]" : "py-6 px-[1.1rem] pb-[1.35rem]"}`}
      >
        <div
          className={`flex items-center transition-[gap] duration-240 ease-in-out ${collapsed ? "gap-0 justify-center" : "gap-3 justify-start"}`}
        >
          {/* Brand mark — the Bronit icon */}
          <BrandMark size={40} priority />
          {/* Name lockup */}
          <div
            className={`overflow-hidden whitespace-nowrap transition-all duration-220 ease-in-out ${collapsed ? "max-w-0 opacity-0" : "max-w-42.5 opacity-100"}`}
          >
            <div className="text-white text-[1.15rem] font-extrabold leading-[1.15] tracking-tight">
              Bronit
            </div>
            <div className="text-white/45 text-[0.7rem] tracking-wider mt-0.5">
              {t("brandTagline")}
            </div>
          </div>

          {mobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label={t("closeMenuAria")}
              className="ml-auto w-8 h-8 shrink-0 inline-flex items-center justify-center bg-white/6 border border-white/8 rounded-lg text-white/70 cursor-pointer"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-[1rem_0.75rem] flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
        <div
          className={`px-2.5 uppercase font-bold text-[0.65rem] tracking-[0.12em] text-white/28 overflow-hidden whitespace-nowrap transition-all duration-220 ease-in-out ${collapsed ? "h-0 mb-0 opacity-0" : "h-5.5 mb-2 opacity-100"}`}
        >
          {t("menu")}
        </div>
        {visibleItems.map((item) => {
          const isBookingItem = item.href === "/book";
          const isSettingsItem = item.href === "/settings";
          const isActive =
            !isBookingItem && pathname.startsWith(localized(item.href));
          const badge = "badge" in item ? (item.badge ?? 0) : 0;

          const itemClassName = `relative flex items-center w-full border-none no-underline text-sm font-medium cursor-pointer rounded-xl transition-all duration-150 ease-in-out hover:bg-white/6 ${
            collapsed
              ? "gap-0 justify-center py-2.5 px-0"
              : "gap-2.75 justify-start py-2.25 px-2.75"
          } ${
            isActive
              ? "bg-[linear-gradient(135deg,rgba(79,110,247,0.28),rgba(124,58,237,0.22))] text-white font-semibold shadow-[inset_0_0_0_1px_rgba(124,146,255,0.25)]"
              : "text-[var(--sidebar-text)]"
          }`;

          const itemContent = (
            <>
              {isActive && !collapsed && (
                <span className="absolute -left-1.75 top-1/2 -translate-y-1/2 w-0.75 h-4.5 rounded-[4px] bg-(--sidebar-active)" />
              )}
              <span
                className={`relative inline-flex shrink-0 ${isActive ? "text-white" : "text-(--sidebar-text)"}`}
              >
                {item.icon}
                {collapsed && badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-2 h-2 rounded-full bg-[--color-danger] shadow-[0_0_0_2px_var(--sidebar-bg)]" />
                )}
              </span>
              <span
                className={`flex-1 flex items-center overflow-hidden whitespace-nowrap transition-all duration-220 ease-in-out ${collapsed ? "max-w-0 opacity-0" : "max-w-50 opacity-100"}`}
              >
                <span className="flex-1 text-left">{item.label}</span>
                {badge > 0 && (
                  <span className="ml-2 min-w-4.5 h-4.5 px-1.25 rounded-full bg-[--color-danger] text-white text-[0.68rem] font-bold inline-flex items-center justify-center shadow-[0_2px_6px_rgba(239,68,68,0.45)]">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
                {isSettingsItem && (
                  <span
                    className={`ml-2 text-white/50 inline-flex transition-transform duration-200 ease-out ${settingsExpanded ? "rotate-0" : "-rotate-90"}`}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                )}
              </span>
            </>
          );

          return (
            <div key={item.href}>
              {isBookingItem ? (
                <button
                  type="button"
                  title={collapsed ? item.label : undefined}
                  className={itemClassName}
                  onClick={() => openBookingModal()}
                >
                  {itemContent}
                </button>
              ) : isSettingsItem ? (
                <button
                  type="button"
                  title={collapsed ? item.label : undefined}
                  className={itemClassName}
                  onClick={() => {
                    if (collapsed && onToggle) {
                      onToggle();
                      setSettingsExpanded(true);
                    } else {
                      setSettingsExpanded(!settingsExpanded);
                    }
                  }}
                >
                  {itemContent}
                </button>
              ) : (
                <Link
                  href={localized(item.href)}
                  title={collapsed ? item.label : undefined}
                  className={itemClassName}
                >
                  {itemContent}
                </Link>
              )}

              {/* Sub-items for settings — only shown when expanded */}
              {item.children && settingsExpanded && !collapsed && (
                <div className="ml-7 mt-0.5 flex flex-col gap-0.5">
                  {item.children.map((child) => {
                    const childHref = localized(child.href);
                    const childActive =
                      pathname === childHref || pathname.startsWith(childHref);
                    return (
                      <Link
                        key={child.href}
                        href={childHref}
                        className={`block px-2.5 py-1.5 rounded-md no-underline text-[0.8125rem] transition-all duration-150 ease-in-out whitespace-nowrap ${
                          childActive
                            ? "text-white bg-brand-500/20 font-medium"
                            : "text-[--sidebar-text] hover:bg-white/6"
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom: account, language, logout, and the collapse / expand toggle */}
      <div
        className={`border-t border-white/6 flex flex-col gap-2.5 transition-[padding] duration-240 ease-in-out ${collapsed ? "py-[0.6rem] px-0" : "p-3 items-stretch"}`}
      >
        {/* Account */}
        <div
          className={`flex items-center transition-[gap] duration-240 ease-in-out ${collapsed ? "gap-0 justify-center p-0" : "gap-2.5 justify-start p-0.5"}`}
        >
          <div
            title={collapsed ? `${userName} · ${accountContext}` : undefined}
            className="w-9 h-9 rounded-full bg-[linear-gradient(135deg,#4f6ef7,#7c3aed)] flex items-center justify-center text-white font-bold text-[0.9rem] shadow-[0_3px_8px_rgba(79,110,247,0.35)] shrink-0"
          >
            {(userName.charAt(0) || "?").toUpperCase()}
          </div>
          <div
            className={`flex-1 min-w-0 overflow-hidden transition-all duration-220 ease-in-out ${collapsed ? "max-w-0 opacity-0" : "max-w-50 opacity-100"}`}
          >
            <div className="text-white text-[0.8125rem] font-semibold leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {userName}
            </div>
            <div className="text-(--sidebar-active,#8ea2ff) text-[0.7rem] font-medium leading-[1.3] whitespace-nowrap overflow-hidden text-ellipsis">
              {accountContext}
            </div>
            <div className="text-white/40 text-[0.68rem] leading-[1.3] whitespace-nowrap overflow-hidden text-ellipsis">
              {userEmail}
            </div>
          </div>
        </div>

        {/* Language segmented control — hidden in the rail */}
        {!collapsed && (
          <div className="flex gap-0.5 p-0.75 rounded-lg bg-white/5 border border-white/6">
            {LANGUAGES.map((l) => {
              const active = l.code === lang;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code as LanguageCode)}
                  className={`flex-1 py-1.25 rounded-md border-none cursor-pointer text-[0.7rem] font-bold tracking-wide transition-all duration-150 ease-in-out ${
                    active
                      ? "text-white bg-[linear-gradient(135deg,rgba(79,110,247,0.9),rgba(124,58,237,0.85))] shadow-[0_2px_6px_rgba(79,110,247,0.35)]"
                      : "text-white/50 bg-transparent hover:text-white/80"
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Logout + collapse toggle */}
        <div
          className={`flex items-center gap-2 ${collapsed ? "flex-col w-auto" : "flex-row w-full"}`}
        >
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title={t("signOut")}
            aria-label={t("signOut")}
            className={`h-8.5 inline-flex items-center justify-center gap-2 bg-white/5 border border-white/8 rounded-lg text-white/65 hover:bg-red-500/15 hover:text-red-300 transition-colors duration-150 ${
              collapsed ? "w-8.5 shrink-0" : "flex-1"
            } ${loggingOut ? "cursor-default opacity-60" : "cursor-pointer opacity-100"}`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!collapsed && (
              <span className="whitespace-nowrap text-[0.8rem] font-medium">
                {t("signOut")}
              </span>
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => {
              if (theme === "light") setTheme("dark");
              else if (theme === "dark") setTheme("system");
              else setTheme("light");
            }}
            title={`Theme: ${theme}`}
            aria-label="Theme toggle"
            className="w-8.5 h-8.5 shrink-0 inline-flex items-center justify-center bg-white/5 border border-white/8 rounded-lg text-white/65 hover:bg-white/12 hover:text-white cursor-pointer transition-colors duration-150"
          >
            {theme === "dark" ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : theme === "light" ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            )}
          </button>

          {!mobile && (
            <button
              type="button"
              onClick={onToggle}
              title={collapsed ? t("expandMenu") : t("collapseMenu")}
              aria-label={collapsed ? t("expandMenu") : t("collapseMenu")}
              className="w-8.5 h-8.5 shrink-0 inline-flex items-center justify-center bg-white/5 border border-white/8 rounded-lg text-white/65 hover:bg-white/12 hover:text-white cursor-pointer transition-colors duration-150"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-240 ease-in-out ${collapsed ? "rotate-180" : "rotate-0"}`}
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
