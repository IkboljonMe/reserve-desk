import type { Metadata } from "next";
import "../globals.css";
import { LOCALES, isLocale, DEFAULT_LOCALE } from "@/i18n/config";
import { LanguageProvider } from "@/i18n";

export const metadata: Metadata = {
  metadataBase: new URL("https://smartix.uz"),
  title: {
    default: "Smartix — Hotel service booking, simplified",
    template: "%s · Smartix",
  },
  description:
    "Smartix brings spa slots, conference halls, pools and every bookable hotel service into one dashboard — with payments, deposits, staff roles, and instant Telegram alerts.",
  applicationName: "Smartix",
  keywords: [
    "Smartix",
    "hotel service booking",
    "reservation management",
    "spa booking",
    "conference hall booking",
    "pool booking",
    "hotel dashboard",
    "Uzbekistan",
  ],
  authors: [{ name: "Smartix" }],
  icons: {
    icon: "/favicon.ico",
    apple: "/assets/smartix-logo.png",
  },
  openGraph: {
    type: "website",
    siteName: "Smartix",
    title: "Smartix — Hotel service booking, simplified",
    description:
      "One dashboard for every bookable hotel service: bookings, payments, deposits, staff roles, and Telegram alerts.",
    url: "https://smartix.uz",
    images: [{ url: "/assets/smartix-logo.png", width: 1024, height: 1024, alt: "Smartix" }],
  },
  twitter: {
    card: "summary",
    title: "Smartix — Hotel service booking, simplified",
    description: "One dashboard for every bookable hotel service.",
    images: ["/assets/smartix-logo.png"],
  },
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
