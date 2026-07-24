import type { Metadata } from "next";
import { Zen_Dots, Inter } from "next/font/google";
import "../globals.css";
import { LOCALES, isLocale, FALLBACK_LOCALE } from "@/i18n/config";
import { LanguageProvider } from "@/i18n";
import { getT } from "@/i18n/dictionary";
import { ThemeProvider } from "@/providers/ThemeProvider";
import QueryProvider from "@/providers/QueryProvider";

// Geometric display face for the brand wordmark / big numbers. Self-hosted by
// next/font and exposed as the CSS variable --font-zen-dots.
const zenDots = Zen_Dots({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-zen-dots",
  display: "swap",
});

// Primary body font
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

// Open Graph locale codes for each supported language.
const OG_LOCALE: Record<string, string> = {
  uz: "uz_UZ",
  ru: "ru_RU",
  en: "en_US",
};

// Per-locale metadata — resolves the marketing title/description in the request
// language so <head> tags aren't hard-coded to English.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : FALLBACK_LOCALE;
  const t = getT(lang);
  const title = t("metaTitleDefault");

  return {
    metadataBase: new URL("https://bronit.uz"),
    title: {
      default: title,
      template: "%s · Bronit",
    },
    description: t("metaDescription"),
    // Self-referencing canonical + hreflang alternates so each locale page
    // declares itself and its siblings (x-default → the neutral fallback locale
    // for visitors whose language matches none of ours).
    alternates: {
      canonical: `/${lang}`,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])),
        "x-default": `/${FALLBACK_LOCALE}`,
      },
    },
    applicationName: "Bronit",
    keywords: [
      "Bronit",
      "business management software",
      "booking system",
      "reservation management",
      "appointment scheduling",
      "service booking dashboard",
      "business automation",
      "replace Excel spreadsheets",
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
      locale: OG_LOCALE[lang],
      title,
      description: t("metaOgDescription"),
      url: `https://bronit.uz/${lang}`,
      images: [
        {
          url: "/assets/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "Bronit",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: t("metaTwitterDescription"),
      images: ["/assets/og-image.jpg"],
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
  const lang = isLocale(locale) ? locale : FALLBACK_LOCALE;

  return (
    // suppressHydrationWarning: some browser extensions inject attributes on
    // <html> (e.g. __gcrremoteframetoken) before React hydrates, which would
    // otherwise trip a hydration mismatch. It only affects this element's own
    // attributes, not its children.
    <html
      lang={lang}
      className={`${zenDots.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body>
        <QueryProvider>
          <ThemeProvider>
            <LanguageProvider lang={lang}>{children}</LanguageProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
