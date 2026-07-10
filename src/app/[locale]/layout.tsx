import type { Metadata } from "next";
import "../globals.css";
import { LOCALES, isLocale, DEFAULT_LOCALE } from "@/i18n/config";
import { LanguageProvider } from "@/i18n";

export const metadata: Metadata = {
  title: "Easy Service — Always Available",
  description: "Service reservation management system for staff",
};

// Pre-render the locale segment for each supported language.
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : DEFAULT_LOCALE;

  return (
    <html lang={locale}>
      <body>
        <LanguageProvider lang={lang}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
