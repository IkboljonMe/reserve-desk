import type { Metadata } from "next";
import { Zen_Dots } from "next/font/google";
import "../globals.css";
import { LOCALES, isLocale, DEFAULT_LOCALE } from "@/i18n/config";
import { LanguageProvider } from "@/i18n";

// Geometric display face for the brand wordmark / big numbers. Self-hosted by
// next/font and exposed as the CSS variable --font-zen-dots.
const zenDots = Zen_Dots({ weight: "400", subsets: ["latin"], variable: "--font-zen-dots", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://bronit.uz"),
  title: {
    default: "Bronit — Hotel service booking, simplified",
    template: "%s · Bronit",
  },
  description:
    "Bronit brings spa slots, conference halls, pools and every bookable hotel service into one dashboard — with payments, deposits, staff roles, and instant Telegram alerts.",
  applicationName: "Bronit",
  keywords: [
    "Bronit",
    "hotel service booking",
    "reservation management",
    "spa booking",
    "conference hall booking",
    "pool booking",
    "hotel dashboard",
    "Uzbekistan",
  ],
  authors: [{ name: "Bronit" }],
  icons: {
    icon: [
      { url: "/assets/bronit-logo.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/assets/bronit-logo.png",
    apple: "/assets/bronit-logo.png",
  },
  openGraph: {
    type: "website",
    siteName: "Bronit",
    title: "Bronit — Hotel service booking, simplified",
    description:
      "One dashboard for every bookable hotel service: bookings, payments, deposits, staff roles, and Telegram alerts.",
    url: "https://bronit.uz",
    images: [{ url: "/assets/bronit-logo.png", width: 1024, height: 1024, alt: "Bronit" }],
  },
  twitter: {
    card: "summary",
    title: "Bronit — Hotel service booking, simplified",
    description: "One dashboard for every bookable hotel service.",
    images: ["/assets/bronit-logo.png"],
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
    <html lang={locale} className={zenDots.variable}>
      <body>
        <LanguageProvider lang={lang}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
