import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { getLegal, type LegalDoc } from "./legalContent";

const BACK_LABEL: Record<string, string> = {
  en: "Back to home",
  uz: "Bosh sahifaga",
  ru: "На главную",
};

// Renders a legal document (Privacy Policy / Terms of Use) as a simple,
// readable article with a minimal branded header.
export function LegalPage({ doc, locale }: { doc: LegalDoc; locale: string }) {
  const c = getLegal(doc, locale);
  const back = BACK_LABEL[locale] ?? BACK_LABEL.en;

  return (
    <main className="min-h-dvh bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="max-w-200 mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 no-underline"
          >
            <BrandMark size={30} />
            <span className="text-slate-900 text-[1.05rem] font-extrabold tracking-tight">
              Bronit
            </span>
          </Link>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 text-slate-500 text-[0.85rem] no-underline hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={15} /> {back}
          </Link>
        </div>
      </header>

      <article className="max-w-200 mx-auto px-6 py-12">
        <h1 className="text-[2rem] font-extrabold tracking-tight mb-1.5">
          {c.title}
        </h1>
        <p className="text-slate-400 text-[0.82rem] mb-6">{c.updated}</p>
        <p className="text-slate-600 text-[0.95rem] leading-relaxed mb-8">
          {c.intro}
        </p>

        <div className="flex flex-col gap-7">
          {c.sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-[1.15rem] font-bold mb-2">{s.heading}</h2>
              <p className="text-slate-600 text-[0.92rem] leading-relaxed">
                {s.body}
              </p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
