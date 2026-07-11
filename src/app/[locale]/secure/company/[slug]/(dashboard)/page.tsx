import { redirect } from 'next/navigation'

// Reached only if proxy.ts somehow lets a bare /secure/company/{slug} request
// through without already redirecting to dashboard/calendar.
export default async function HomePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  redirect(`/${locale}/secure/company/${slug}/dashboard`)
}
