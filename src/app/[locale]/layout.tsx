import type { Metadata } from "next";
import "../globals.css";
import { LOCALES } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Safir Hotel Services — Hotel Admin",
  description: "Hotel service reservation management system for staff",
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

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
