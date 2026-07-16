import type { Metadata } from "next";
import { Zen_Dots } from "next/font/google";
import "../globals.css";
import { LOCALES, isLocale, DEFAULT_LOCALE } from "@/i18n/config";
import { LanguageProvider } from "@/i18n";
import { getT } from "@/i18n/dictionary";
import { ThemeProvider } from "@/components/ThemeProvider";

// Geometric display face for the brand wordmark / big numbers. Self-hosted by
// next/font and exposed as the CSS variable --font-zen-dots.
const zenDots = Zen_Dots({ weight: "400", subsets: ["latin"], variable: "--font-zen-dots", display: "swap" });

// Open Graph locale codes for each supported language.
const OG_LOCALE: Record<string, string> = { uz: "uz_UZ", ru: "ru_RU", en: "en_US" };

// Per-locale metadata — resolves the marketing title/description in the request
// language so <head> tags aren't hard-coded to English.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getT(locale);
  const title = t("metaTitleDefault");

  return {
    metadataBase: new URL("https://bronit.uz"),
    title: {
      default: title,
      template: "%s · Bronit",
    },
    description: t("metaDescription"),
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
      locale: OG_LOCALE[isLocale(locale) ? locale : DEFAULT_LOCALE],
      title,
      description: t("metaOgDescription"),
      url: `https://bronit.uz/${isLocale(locale) ? locale : DEFAULT_LOCALE}`,
      images: [{ url: "/assets/bronit-logo.png", width: 1024, height: 1024, alt: "Bronit" }],
    },
    twitter: {
      card: "summary",
      title,
      description: t("metaTwitterDescription"),
      images: ["/assets/bronit-logo.png"],
    },
  };
}

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
        <ThemeProvider>
          <LanguageProvider lang={lang}>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
