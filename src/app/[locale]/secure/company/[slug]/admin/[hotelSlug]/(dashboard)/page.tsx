import { redirect } from "next/navigation";

// Reached only if proxy.ts lets a bare /secure/company/{slug}/admin/{hotelSlug}
// request through — admins land on their calendar.
export default async function HotelAdminHomePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; hotelSlug: string }>;
}) {
  const { locale, slug, hotelSlug } = await params;
  redirect(`/${locale}/secure/company/${slug}/admin/${hotelSlug}/calendar`);
}
