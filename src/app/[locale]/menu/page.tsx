import { redirect, notFound } from "next/navigation";
import { guestHubPath } from "@/lib/menu";

// Legacy hub URL (bronit.uz/<locale>/menu?hotel=<slug>&room=<n>) — kept so old
// QR codes / links keep working. Redirects to the path-based hub.
export default async function LegacyGuestHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ hotel?: string; room?: string }>;
}) {
  const { locale } = await params;
  const { hotel, room } = await searchParams;
  if (!hotel) notFound();
  redirect(guestHubPath(locale, hotel, room));
}
