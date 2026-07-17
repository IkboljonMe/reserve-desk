"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import Sidebar from "./Sidebar";
import Button from "@/components/ui/Button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTranslation } from "@/i18n";
import { useBookingModal } from "@/components/BookingModalProvider";
import { nowUZ } from "@/lib/timezone";
import type { SessionRole } from "@/lib/session";

interface Props {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  role: SessionRole;
  basePath: string;
  hotelName: string;
  readOnly?: boolean;
}

export default function DashboardContainer({
  children,
  userName,
  userEmail,
  role,
  basePath,
  hotelName,
  readOnly,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { openBookingModal } = useBookingModal();

  // Close the off-canvas nav whenever the route changes (adjusted during
  // render, not an effect, to avoid an extra post-navigation frame).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileNavOpen(false);
  }

  return (
    <div className="h-dvh relative">
      {/* Full-bleed shell: sidebar + content fill the viewport edge-to-edge with
          no outer frame, so nothing reads as a floating card. */}
      <div className="flex h-full overflow-hidden relative">
        {/* Thin brand accent strip across the very top. */}
        <div className="absolute top-0 left-0 right-0 h-0.75 bg-(--brand-gradient) z-2" />

        {isMobile && mobileNavOpen && (
          <div
            className="fixed inset-0 z-149 bg-gray-900/50 animate-[fadeIn_0.18s_ease]"
            onClick={() => setMobileNavOpen(false)}
          />
        )}

        <Sidebar
          collapsed={isMobile ? false : collapsed}
          role={role}
          basePath={basePath}
          onToggle={() => setCollapsed(!collapsed)}
          userName={userName}
          userEmail={userEmail}
          hotelName={hotelName}
          mobile={isMobile}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="hidden max-md:flex items-center gap-3 p-[0.85rem_1rem] border-b border-(--surface-border) bg-(--surface-card)">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label={t("openMenuAria")}
              className="w-9.5 h-9.5 shrink-0 inline-flex items-center justify-center rounded-lg border border-(--gray-200) bg-white text-(--gray-700) cursor-pointer"
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
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="font-extrabold text-[1rem] text-(--gray-800) tracking-tight">
              Bronit
            </div>

            {/* New booking lives in the mobile top bar so the dashboard body
                stays uncluttered on small screens. Hidden when the plan is
                read-only (expired). */}
            {!readOnly && (
              <Button
                variant="primary"
                size="sm"
                className="ml-auto shrink-0"
                leftIcon={<Plus size={14} strokeWidth={2.5} />}
                onClick={() =>
                  openBookingModal({ date: format(nowUZ(), "yyyy-MM-dd") })
                }
              >
                {t("newBooking")}
              </Button>
            )}
          </div>

          {readOnly && (
            <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-[0.85rem] font-semibold text-center">
              {t("planExpiredBanner")}
            </div>
          )}

          <main
            className={`flex-1 overflow-auto bg-(--surface-card) ${isMobile ? "p-[1.1rem]" : "py-7 px-8"}`}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
