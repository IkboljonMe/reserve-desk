"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { LANGUAGES } from "@/i18n";
import { LOCALE_COOKIE, isLocale, type LanguageCode } from "@/i18n/config";

// Remember the chosen language so the proxy honours it on later locale-less
// requests. Module-scope so the cookie write isn't inside the component body.
function rememberLocale(code: LanguageCode) {
  document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

// Locale switcher for the marketing navbar. The landing page lives outside the
// dashboard's LanguageProvider, so this is self-contained: it swaps the locale
// segment of the current URL and stores the choice in the `appLang` cookie.
// On mobile it collapses to just the flag; on ≥sm it shows the label too.
export function LandingLangToggle({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const switchTo = (value: string) => {
    setOpen(false);
    if (!isLocale(value) || value === current) return;
    rememberLocale(value);
    const segments = pathname.split("/");
    if (isLocale(segments[1])) segments[1] = value;
    else segments.splice(1, 0, value);
    router.push(segments.join("/") || `/${value}`);
  };

  const active = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];

  return (
    <div ref={rootRef} className="relative inline-block text-left select-none">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Language"
        className="h-[38px] w-[38px] sm:w-auto justify-center sm:justify-between px-0 sm:px-3.5 inline-flex items-center gap-1.75 rounded-[10px] bg-(--gray-100) hover:bg-[var(--gray-200)] text-[var(--gray-700)] cursor-pointer border border-[var(--surface-border)] transition-all duration-150 text-[0.8rem] font-semibold"
      >
        <span className="text-base leading-none">{active.flag}</span>
        <span className="hidden sm:inline">{active.label}</span>
        <ChevronDown
          size={12}
          className={`hidden sm:block shrink-0 text-[var(--gray-400)] transition-transform duration-150 ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute top-[calc(100%+6px)] right-0 z-[9999] list-none m-0 p-1 bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[10px] shadow-[0_12px_32px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.04)] w-[120px] box-border"
        >
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === current;
            return (
              <li
                key={lang.code}
                role="option"
                aria-selected={isSelected}
                onClick={() => switchTo(lang.code)}
                className={`flex items-center justify-between gap-2 p-2 rounded-lg cursor-pointer text-[0.8rem] transition-all duration-100 ease-in-out box-border ${
                  isSelected
                    ? "font-bold text-[var(--brand-600)] bg-[var(--sidebar-hover)]"
                    : "text-[var(--gray-700)] hover:bg-[var(--gray-50)] hover:text-[--gray-900]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base leading-none">{lang.flag}</span>
                  {lang.label}
                </span>
                {isSelected && (
                  <Check
                    size={13}
                    className="shrink-0 text-[var(--brand-500)]"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
