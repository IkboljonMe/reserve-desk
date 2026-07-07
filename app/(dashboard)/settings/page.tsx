import { redirect } from 'next/navigation'

// The General settings page has been removed.
// Redirect root /settings to the Services tab.
export default function SettingsRootPage() {
  redirect('/settings/services')
}
