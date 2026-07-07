import { redirect } from 'next/navigation'

// Root path has no page of its own — send users to the dashboard.
// (Unauthenticated requests are redirected to /login by the auth proxy.)
export default function RootPage() {
  redirect('/dashboard')
}
