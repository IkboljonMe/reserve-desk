import { redirect } from 'next/navigation'

// The General settings page has been removed.
// Redirect root /settings to the Admins tab (the owner's default landing).
export default async function SettingsRootPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect(`/${locale}/settings/admins`)
}
