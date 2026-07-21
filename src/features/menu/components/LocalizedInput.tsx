"use client";

import { useState } from "react";
import { Languages, Lock } from "lucide-react";
import { useTranslation } from "@/i18n";
import { MENU_LANGS, MENU_LANG_LABELS, type MenuLang } from "@/lib/menu";
import type { LocalizedText } from "../types";

export const FIELD_INPUT =
  "flex-1 min-w-0 px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[--gray-800] hover:border-[var(--gray-300)] focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)] disabled:bg-[var(--gray-50)] disabled:text-[--gray-500]";

// A translatable text field: language tabs (10 — MENU_LANGS) editing a
// LocalizedText value in place, plus a "Translate" button (Google Translate,
// source language -> the rest) and a per-language "keep original" lock that
// mirrors the source text instead of a (possibly wrong) machine translation.
// Used for menu category/product names & descriptions.
export function LocalizedInput({
  label,
  value,
  onChange,
  sourceLang,
  locked,
  onLockedChange,
  onTranslate,
  textarea,
  placeholder,
}: {
  label: string;
  value: LocalizedText;
  onChange: (v: LocalizedText) => void;
  sourceLang: MenuLang;
  locked: string[];
  onLockedChange: (locked: string[]) => void;
  onTranslate: (
    text: string,
    sourceLang: string,
    skip: string[],
  ) => Promise<Record<string, string>>;
  textarea?: boolean;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const [activeLang, setActiveLang] = useState<MenuLang>(sourceLang);
  const [translating, setTranslating] = useState(false);

  // Jump to the new source language's tab when the admin switches input
  // language. Adjusted during render (not an effect) per React's guidance for
  // state that must follow a prop change.
  const [prevSourceLang, setPrevSourceLang] = useState(sourceLang);
  if (sourceLang !== prevSourceLang) {
    setPrevSourceLang(sourceLang);
    setActiveLang(sourceLang);
  }

  const set = (key: MenuLang, v: string) => onChange({ ...value, [key]: v });

  const isLocked = (lang: MenuLang) => locked.includes(lang);
  const toggleLock = (lang: MenuLang) => {
    if (isLocked(lang)) {
      onLockedChange(locked.filter((l) => l !== lang));
    } else {
      onLockedChange([...locked, lang]);
      set(lang, value[sourceLang]);
    }
  };

  async function translateAll() {
    const sourceText = value[sourceLang];
    if (!sourceText.trim() || translating) return;
    setTranslating(true);
    try {
      const translations = await onTranslate(sourceText, sourceLang, locked);
      const next = { ...value };
      for (const lang of MENU_LANGS) {
        if (lang === sourceLang) continue;
        if (isLocked(lang)) next[lang] = sourceText;
        else if (translations[lang]) next[lang] = translations[lang];
      }
      onChange(next);
    } finally {
      setTranslating(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
          {label}
        </label>
        <button
          type="button"
          onClick={translateAll}
          disabled={translating || !value[sourceLang]?.trim()}
          className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-(--brand-600) hover:text-(--brand-700) disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Languages size={12} />
          {translating ? t("translating") : t("translateAll")}
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {MENU_LANGS.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setActiveLang(lang)}
            className={`px-2 py-1 rounded-md text-[0.7rem] font-bold whitespace-nowrap transition-colors ${
              activeLang === lang
                ? "bg-[--brand-500] text-white"
                : isLocked(lang)
                  ? "bg-(--gray-100) text-(--gray-400)"
                  : "bg-(--gray-100) text-[--gray-600] hover:bg-(--gray-200)"
            }`}
          >
            {lang === sourceLang && "★ "}
            {MENU_LANG_LABELS[lang]}
            {isLocked(lang) && (
              <Lock size={9} className="inline ml-1 -mt-0.5" />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-start gap-2">
        {textarea ? (
          <textarea
            className={`${FIELD_INPUT} resize-y min-h-13`}
            value={value[activeLang]}
            placeholder={placeholder}
            disabled={activeLang !== sourceLang && isLocked(activeLang)}
            onChange={(e) => set(activeLang, e.target.value)}
          />
        ) : (
          <input
            className={FIELD_INPUT}
            value={value[activeLang]}
            placeholder={placeholder}
            disabled={activeLang !== sourceLang && isLocked(activeLang)}
            onChange={(e) => set(activeLang, e.target.value)}
          />
        )}
      </div>

      {activeLang !== sourceLang && (
        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 accent-(--brand-500)"
            checked={isLocked(activeLang)}
            onChange={() => toggleLock(activeLang)}
          />
          <span className="text-[0.72rem] text-[--gray-500] font-medium">
            {t("keepOriginalLang")}
          </span>
        </label>
      )}
    </div>
  );
}
