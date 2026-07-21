import { redirect } from "next/navigation";

// "New Booking" is now a modal opened from the dashboard/calendar/sidebar
// rather than a dedicated page — send any stale /book links to the calendar.
export default async function BookPageRedirect({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  redirect(`/${locale}/secure/company/${slug}/calendar`);
}
