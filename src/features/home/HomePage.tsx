import { headers } from "next/headers";
import { getT } from "@/i18n/dictionary";
import { JsonLd } from "@/components/JsonLd";
import type { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Company } from "@/models/Company";
import { Hotel } from "@/models/Hotel";
import { HotelMenuSettings } from "@/models/HotelMenuSettings";
import { DEMO_SLUG } from "@/features/demo/config";
import { guestHubPath } from "@/lib/menu";
import { PRICING_PLANS } from "./constants";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Reviews } from "./components/Reviews";
import { Modules } from "./components/Modules";
import { Pricing } from "./components/Pricing";
import { Faq } from "./components/Faq";
import { FinalCta } from "./components/FinalCta";
import { Footer, TELEGRAM_URL, INSTAGRAM_URL } from "./components/Footer";
import { ContactWidget } from "./components/ContactWidget";

// The marketing landing page. Server component: resolves translations + the
// request host (for cross-subdomain links), then composes the sections.
export async function HomePage({ locale }: { locale: string }) {
  const t = getT(locale);
  const loginHref = `/${locale}/login`;

  // Cross-subdomain links. The marketing site lives on the root domain; the demo
  // runs on the `demo.` subdomain, so build an absolute URL to it from the request
  // host (works for prod `bronit.uz` and local `bronit.test:3000` alike).
  const reqHeaders = await headers();
  const host = reqHeaders.get("host") || "";
  const protocol =
    reqHeaders.get("x-forwarded-proto") ||
    (host.includes("localhost") || host.includes(".test") ? "http" : "https");
  const baseDomain = host.replace(/^(www|app|admin|super|demo)\./, "");
  const demoHubUrl = `${protocol}://demo.${baseDomain}/${locale}/demo`;
  const demoDashboardUrl = `${demoHubUrl}/enter`;

  await connectDB();
  const company = await Company.findOne({ slug: DEMO_SLUG })
    .select("_id")
    .lean<{ _id: Types.ObjectId } | null>();
  const menuSettings = company
    ? await HotelMenuSettings.findOne({
        companyId: company._id,
        menuEnabled: true,
      })
        .select("hotelId")
        .lean<{ hotelId: Types.ObjectId } | null>()
    : null;
  const menuHotel = menuSettings
    ? await Hotel.findById(menuSettings.hotelId)
        .select("slug")
        .lean<{ slug?: string } | null>()
    : null;
  const demoMenuUrl = menuHotel?.slug
    ? `${protocol}://demo.${baseDomain}${guestHubPath(locale, menuHotel.slug, "101")}`
    : demoHubUrl;

  // In-page section links, shared by the desktop nav and the mobile drawer.
  const navLinks = [
    { href: "#features", label: t("lpNavFeatures") },
    { href: "#reviews", label: t("lpNavReviews") },
    { href: "#pricing", label: t("lpNavPricing") },
    { href: "#faq", label: "FAQ" },
  ];

  // Structured data for rich results, from the static landing prices.
  const prices = PRICING_PLANS.map((p) => p.price).filter((p) => p > 0);
  // WebSite schema is the signal Google uses to render the SERP site name — this
  // is what turns the "bronit.uz" line above the title into "Bronit".
  const webSiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Bronit",
    url: "https://bronit.uz",
  };
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Bronit",
    url: "https://bronit.uz",
    logo: "https://bronit.uz/assets/bronit-logo.png",
    // Verified brand profiles — helps Google associate them with the entity.
    sameAs: [TELEGRAM_URL, INSTAGRAM_URL],
  };
  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Bronit",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: t("metaDescription"),
    url: `https://bronit.uz/${locale}`,
    offers: prices.length
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "UZS",
          lowPrice: String(Math.min(...prices)),
          highPrice: String(Math.max(...prices)),
          offerCount: PRICING_PLANS.length,
        }
      : undefined,
  };

  return (
    <main className="bg-(--surface-bg) text-(--gray-900) min-h-dvh overflow-x-clip transition-colors duration-200">
      <JsonLd data={webSiteLd} />
      <JsonLd data={organizationLd} />
      <JsonLd data={softwareLd} />
      <Navbar
        locale={locale}
        t={t}
        demoUrl={demoHubUrl}
        loginHref={loginHref}
        navLinks={navLinks}
      />
      <Hero
        t={t}
        demoDashboardUrl={demoDashboardUrl}
        demoMenuUrl={demoMenuUrl}
        demoHubUrl={demoHubUrl}
      />
      <div className="relative bg-(--surface-bg) transition-colors duration-200">
        <Features t={t} />
        <Reviews t={t} />
        <Modules t={t} />
        <Pricing t={t} demoUrl={demoHubUrl} />
        <Faq t={t} />
        <FinalCta t={t} demoUrl={demoHubUrl} />
        <Footer t={t} lang={locale} demoUrl={demoHubUrl} loginHref={loginHref} />
      </div>

      <ContactWidget
        title={t("lpContactTitle")}
        desc={t("lpContactDesc")}
        namePlaceholder={t("lpContactName")}
        phonePlaceholder={t("lpContactPhone")}
        submitLabel={t("lpContactSubmit")}
        sendingLabel={t("lpContactSending")}
        successMsg={t("lpContactSuccess")}
        errorMsg={t("lpContactError")}
        closeLabel={t("close")}
      />
    </main>
  );
}
