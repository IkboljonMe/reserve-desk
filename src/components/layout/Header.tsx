"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation, LanguageCode, LANGUAGES } from "@/i18n";
import Dropdown from "@/components/ui/Dropdown";
import Button from "@/components/ui/Button";

interface Props {
  userName: string;
  userEmail: string;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export default function Header({
  userName,
  userEmail,
  onToggleSidebar,
  sidebarCollapsed,
}: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const { lang, setLang, t } = useTranslation();

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(`/${lang}/login`);
    router.refresh();
  }

  return (
    <header className="h-15 bg-(--surface-card) border-b border-(--surface-border) flex items-center justify-between px-6 shrink-0">
      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className="w-8.5 h-8.5 shrink-0 bg-[--gray-100] border border-[--gray-200] rounded-lg text-[--gray-600] cursor-pointer flex items-center justify-center transition-colors duration-150 hover:bg-[--gray-200]"
          title={sidebarCollapsed ? t("showSidebar") : t("hideSidebar")}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
      )}
      {!onToggleSidebar && <div />}

      <div className="flex items-center gap-3">
        <Dropdown
          value={lang}
          onChange={(val) => setLang(val as LanguageCode)}
          options={LANGUAGES.map((l) => ({ value: l.code, label: l.label }))}
          ariaLabel={t("language")}
          containerClassName="lang-dropdown"
        />

        <div className="w-px h-6 bg-[--surface-border]" />

        {/* User chip */}
        <div className="flex items-center gap-2.5 p-[4px_6px_4px_4px] rounded-full">
          <div className="w-8.5 h-8.5 rounded-full bg-[linear-gradient(135deg,#4f6ef7,#7c3aed)] flex items-center justify-center text-white font-bold text-[0.85rem] shadow-[0_3px_8px_rgba(79,110,247,0.35)] shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>

          <div className="leading-snug">
            <div className="text-[0.8125rem] font-semibold text-[--gray-800]">
              {userName}
            </div>
            <div className="text-[0.7rem] text-[--gray-400]">{userEmail}</div>
          </div>
        </div>

        <Button
          id="logout-btn"
          onClick={handleLogout}
          disabled={loggingOut}
          variant="ghost"
          icon
          title={t("signOut")}
          aria-label={t("signOut")}
          className="ml-0.5"
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
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </Button>
      </div>
    </header>
  );
}
