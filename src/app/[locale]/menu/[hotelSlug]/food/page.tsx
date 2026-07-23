import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Company } from "@/models/Company";
import { Hotel } from "@/models/Hotel";
import { MenuCategory } from "@/models/MenuCategory";
import { MenuProduct } from "@/models/MenuProduct";
import { MenuRecommendation } from "@/models/MenuRecommendation";
import { HotelMenuSettings } from "@/models/HotelMenuSettings";
import { resolveMenuHotelId } from "@/lib/menuScope";
import { nowUZ } from "@/lib/timezone";
import { getT } from "@/i18n/dictionary";
import {
  GuestMenuClient,
  type GuestLabels,
} from "@/features/menu/guest/GuestMenuClient";
import type {
  MenuCategory as TCategory,
  MenuProduct as TProduct,
} from "@/features/menu/types";

// Food-ordering sub-page — reached from the hub via the "Menyu" tile.
// URL: menu.bronit.uz/<locale>/<hotelSlug>/food[?room=<n>]
export default async function GuestFoodPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; hotelSlug: string }>;
  searchParams: Promise<{ room?: string }>;
}) {
  const { locale, hotelSlug } = await params;
  const { room } = await searchParams;
  const t = getT(locale);

  const hdrs = await headers();
  const isMenuSub = hdrs.get("x-subdomain") === "menu";

  await connectDB();
  const hotel = await Hotel.findOne({ slug: hotelSlug })
    .select("_id name slug shortName companyId")
    .lean<{
      _id: Types.ObjectId;
      name: string;
      slug?: string;
      shortName: string;
      companyId: Types.ObjectId;
    } | null>();
  if (!hotel) notFound();

  const company = await Company.findById(hotel.companyId)
    .select("_id")
    .lean<{ _id: Types.ObjectId } | null>();
  if (!company) notFound();

  const settings = await HotelMenuSettings.findOne({ hotelId: hotel._id })
    .select("menuEnabled serviceFeeType serviceFeeValue")
    .lean<{
      menuEnabled: boolean;
      serviceFeeType: "none" | "percent" | "fixed";
      serviceFeeValue: number;
    } | null>();

  if (settings && !settings.menuEnabled) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-(--surface-bg) text-(--gray-400) text-sm px-4 text-center">
        {t("menuEmpty")}
      </div>
    );
  }

  // In shared-menu mode all hotels display the source hotel's menu content.
  const menuHotelId = await resolveMenuHotelId(hotel.companyId, hotel._id);

  const [categories, products, recommendationDocs] = await Promise.all([
    MenuCategory.find({ hotelId: menuHotelId })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean(),
    MenuProduct.find({ hotelId: menuHotelId, available: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean(),
    MenuRecommendation.find({ hotelId: menuHotelId, dayOfWeek: nowUZ().getDay() })
      .sort({ sortOrder: 1 })
      .populate("productId")
      .lean(),
  ]);

  const recommendations = recommendationDocs
    .map((r) => r.productId as unknown as TProduct & { available?: boolean })
    .filter((p) => p && p.available !== false);

  const serialize = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

  const labels: GuestLabels = {
    room: t("room"),
    sum: t("sum"),
    menuEmpty: t("menuEmpty"),
    add: t("add"),
    total: t("total"),
    close: t("close"),
    cancel: t("cancel"),
    yourOrder: t("yourOrder"),
    viewOrder: t("viewOrder"),
    placeOrder: t("placeOrder"),
    placingOrder: t("placingOrder"),
    orderPlaced: t("orderPlaced"),
    orderPlacedDesc: t("orderPlacedDesc"),
    emptyCart: t("emptyCart"),
    subtotal: t("subtotal"),
    serviceFee: t("serviceFee"),
    roomNumber: t("roomNumber"),
    guestNamePlaceholder: t("guestNamePlaceholder"),
    orderNotePlaceholder: t("orderNotePlaceholder"),
    orderFailed: t("orderFailed"),
    roomRequiredError: t("roomRequiredError"),
    itemsN: t("cartItemsCount"),
    cancelledTitle: t("cancelledTitle"),
    cancelledSub: t("cancelledSub"),
    orderNo: t("orderNo"),
    couldNotLoad: t("couldNotLoad"),
    backToMenu: t("backToMenu"),
    orderSummary: t("orderSummary"),
    notes: t("notes"),
    orderPending: t("orderPending"),
    orderPreparing: t("orderPreparing"),
    orderReady: t("orderReady"),
    orderDelivered: t("orderDelivered"),
    recommendedToday: t("recommendedToday"),
    reviewTitle: t("reviewTitle"),
    reviewCommentPlaceholder: t("reviewCommentPlaceholder"),
    reviewSubmit: t("reviewSubmit"),
    reviewThanks: t("reviewThanks"),
  };

  return (
    <GuestMenuClient
      labels={labels}
      locale={locale}
      hotelName={hotel.name}
      hotelSlug={hotel.slug || hotelSlug}
      room={typeof room === "string" ? room : ""}
      categories={serialize(categories) as unknown as TCategory[]}
      products={serialize(products) as unknown as TProduct[]}
      recommendations={serialize(recommendations)}
      serviceFeeType={settings?.serviceFeeType || "none"}
      serviceFeeValue={settings?.serviceFeeValue || 0}
      isMenuSub={isMenuSub}
    />
  );
}
