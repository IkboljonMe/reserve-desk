import { redirect } from 'next/navigation'

// The locale root has no page of its own — send users to the dashboard.
// (The proxy redirects unauthenticated requests to /{locale}/login, and routes
// the owner/admin to their landing page, so this is a fallback.)
export default async function RootPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect(`/${locale}/dashboard`)
}
