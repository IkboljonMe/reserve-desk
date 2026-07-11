import { redirect } from 'next/navigation'

// The General settings page has been removed.
// Redirect root /settings to the Admins tab (the owner's default landing).
export default async function SettingsRootPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  redirect(`/${locale}/secure/company/${slug}/settings/admins`)
}
