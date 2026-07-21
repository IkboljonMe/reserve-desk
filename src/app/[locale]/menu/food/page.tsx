import { redirect, notFound } from "next/navigation";
import { guestFoodPath } from "@/lib/menu";

// Legacy food URL (bronit.uz/<locale>/menu/food?hotel=<slug>&room=<n>) — kept so
// old links keep working. Redirects to the path-based food page.
export default async function LegacyGuestFoodPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ hotel?: string; room?: string }>;
}) {
  const { locale } = await params;
  const { hotel, room } = await searchParams;
  if (!hotel) notFound();
  redirect(guestFoodPath(locale, hotel, room));
}
