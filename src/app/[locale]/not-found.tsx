"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

type Lang = "en" | "uz" | "ru";

// This page renders outside the dashboard's LanguageProvider, so it reads the
// locale from the URL segment and carries its own small copy table.
const COPY: Record<Lang, { title: string; subtitle: string; back: string }> = {
  en: {
    title: "Page not found",
    subtitle: "The page you're looking for doesn't exist or has been moved.",
    back: "Back to Dashboard",
  },
  uz: {
    title: "Sahifa topilmadi",
    subtitle: "Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan.",
    back: "Boshqaruv paneliga qaytish",
  },
  ru: {
    title: "Страница не найдена",
    subtitle: "Страница, которую вы ищете, не существует или была перемещена.",
    back: "Вернуться на панель",
  },
};

export default function NotFound() {
  const params = useParams();
  const raw = typeof params.locale === "string" ? params.locale : "uz";
  const lang: Lang = (["en", "uz", "ru"] as const).includes(raw as Lang)
    ? (raw as Lang)
    : "uz";

  const t = COPY[lang];

  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-(--surface-bg,#f8fafc)">
      <div className="w-full max-w-115 text-center flex flex-col items-center gap-4">
        <div className="text-[clamp(4.5rem,18vw,7rem)] font-extrabold leading-none tracking-[-0.04em] bg-linear-to-br from-brand-500 to-[#7c3aed] bg-clip-text text-transparent">
          404
        </div>

        <h1 className="text-[1.4rem] font-bold text-(--gray-800,#1f2937) m-0">
          {t.title}
        </h1>

        <p className="text-[0.95rem] text-(--gray-500,#6b7280) m-0 leading-relaxed">
          {t.subtitle}
        </p>

        <Link
          href={`/${lang}/dashboard`}
          className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-transparent py-2.75 px-5.5 text-[0.9375rem] font-semibold text-white whitespace-nowrap tracking-[-0.01em] bg-(image:--brand-gradient) shadow-brand transition-[filter,box-shadow,transform] duration-150 hover:brightness-[1.06] hover:shadow-[0_8px_20px_rgba(79,110,247,0.36)] hover:-translate-y-px active:translate-y-px mt-2"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          {t.back}
        </Link>
      </div>
    </main>
  );
}
