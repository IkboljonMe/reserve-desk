import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Hotel } from "@/models/Hotel";
import { GuestService } from "@/models/GuestService";
import { getT } from "@/i18n/dictionary";
import {
  GuestServicesClient,
  type GuestServiceLabels,
  type GuestServiceDto,
} from "@/features/menu/guest/GuestServicesClient";

// URL: menu.bronit.uz/<locale>/<hotelSlug>/services[?room=<n>]
export default async function GuestServicesPage({
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
    .select("_id name slug")
    .lean<{ _id: Types.ObjectId; name: string; slug?: string } | null>();

  if (!hotel) notFound();

  // Fetch all active GuestServices for this hotel, sorted by sortOrder
  const serviceDocs = await GuestService.find({
    hotelId: hotel._id,
    active: true,
  })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  const services = serviceDocs.map((s) => ({
    _id: String(s._id),
    name: s.name,
    description: s.description,
    nameI18n: s.nameI18n,
    descI18n: s.descI18n,
    imageUrl: s.imageUrl,
    price: s.price,
  })) as unknown as GuestServiceDto[];

  const labels: GuestServiceLabels = {
    room: t("room"),
    roomNumber: t("roomNumber"),
    guestNamePlaceholder: t("guestNamePlaceholder"),
    orderNotePlaceholder: t("orderNotePlaceholder"),
    bookService: t("bookService") || "Забронировать",
    sending: t("sending") || "Отправка...",
    requestSent: t("requestSent") || "Заявка отправлена",
    requestSentDesc:
      t("requestSentDesc") ||
      "Ваш запрос передан на ресепшн. Мы свяжемся с вами в ближайшее время.",
    close: t("close"),
    backToHub: t("backToHub") || "Назад",
    sum: t("sum"),
    noServices: t("noServices") || "Нет доступных услуг",
    bookNow: t("bookNow") || "Забронировать",
    errorFailed: t("errorFailed") || "Произошла ошибка",
    errorRoomRequired: t("roomRequiredError"),
  };

  return (
    <GuestServicesClient
      labels={labels}
      locale={locale}
      hotelName={hotel.name}
      hotelSlug={hotel.slug || hotelSlug}
      room={typeof room === "string" ? room : ""}
      services={services}
      isMenuSub={isMenuSub}
    />
  );
}
