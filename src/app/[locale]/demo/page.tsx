import type { Types } from "mongoose";
import { UtensilsCrossed, LayoutDashboard, ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { getT } from "@/i18n/dictionary";
import { connectDB } from "@/lib/mongodb";
import { Company } from "@/models/Company";
import { Hotel } from "@/models/Hotel";
import { HotelMenuSettings } from "@/models/HotelMenuSettings";
import { DEMO_SLUG } from "@/features/demo/config";
import { guestHubPath } from "@/lib/menu";

// The demo hub: demo.bronit.uz/<locale>. Two real, fully-interactive products
// to try — the dashboard (real seeded tenant, DemoGuard fakes every write) and
// the in-room guest hub/menu (same DemoGuard trick, mounted in menu/layout.tsx).
export default async function DemoHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getT(locale);

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
  const menuHref = menuHotel?.slug
    ? guestHubPath(locale, menuHotel.slug, "101")
    : null;

  return (
    <main className="min-h-dvh flex items-center justify-center bg-[radial-gradient(900px_500px_at_80%_-10%,rgba(124,58,237,0.35),transparent_60%),radial-gradient(800px_500px_at_10%_110%,rgba(79,110,247,0.30),transparent_55%),linear-gradient(135deg,#14192a_0%,#1e2540_50%,#14192a_100%)] px-4 py-10">
      <div className="w-full max-w-180">
        <div className="text-center mb-10">
          <BrandMark size={64} priority className="mx-auto mb-3" />
          <h1 className="text-white text-[1.6rem] font-extrabold tracking-tight mb-1">
            {t("demoHubTitle")}
          </h1>
          <p className="text-white/50 text-sm">{t("demoHubSubtitle")}</p>
        </div>

        <div className="grid grid-cols-2 max-[560px]:grid-cols-1 gap-5">
          <DemoCard
            href={menuHref}
            icon={<UtensilsCrossed size={26} />}
            title={t("demoMenuTitle")}
            desc={t("demoMenuDesc")}
            cta={t("demoTryIt")}
          />
          <DemoCard
            href={`/${locale}/demo/enter`}
            icon={<LayoutDashboard size={26} />}
            title={t("demoDashboardTitle")}
            desc={t("demoDashboardDesc")}
            cta={t("demoTryIt")}
          />
        </div>
      </div>
    </main>
  );
}

function DemoCard({
  href,
  icon,
  title,
  desc,
  cta,
}: {
  href: string | null;
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      className="group flex flex-col gap-3 bg-white/6 backdrop-blur-2xl border border-white/12 rounded-xl p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)] no-underline transition-transform hover:-translate-y-1"
    >
      <span className="w-12 h-12 rounded-2xl bg-(image:--brand-gradient) text-white flex items-center justify-center">
        {icon}
      </span>
      <h2 className="text-white text-[1.1rem] font-bold m-0">{title}</h2>
      <p className="text-white/60 text-[0.85rem] m-0 flex-1">{desc}</p>
      <span className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-white">
        {cta}{" "}
        <ArrowRight
          size={15}
          className="transition-transform group-hover:translate-x-1"
        />
      </span>
    </a>
  );
}
