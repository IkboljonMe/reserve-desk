import { redirect } from 'next/navigation'

// The General settings page has been removed.
// Redirect root /settings to the Admins tab (the owner's default landing).
export default function SettingsRootPage() {
  redirect('/settings/admins')
}
