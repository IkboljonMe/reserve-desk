import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { companyHasFeature } from '@/lib/planAccess'
import TelegramSettingsPage from '@/features/settings/telegram/TelegramSettingsPage'

// Telegram bot notifications are a plan feature (VIP). Gate the page: owners on
// a plan without it are bounced back to the admins settings tab.
export default async function TelegramSettingsRoute({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const session = await getSession()
  if (session?.companyId && !(await companyHasFeature(session.companyId, 'telegram'))) {
    redirect(`/${locale}/secure/company/${slug}/settings/admins`)
  }
  return <TelegramSettingsPage />
}
