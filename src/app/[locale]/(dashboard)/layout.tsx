import { requireAuth } from '@/lib/session'
import { connectDB } from '@/lib/mongodb'
import { Hotel } from '@/models/Hotel'
import { ToastProvider } from '@/components/ToastProvider'
import { DraftProvider } from '@/components/DraftProvider'
import { LanguageProvider } from '@/i18n'
import { isLocale, DEFAULT_LOCALE } from '@/i18n/config'
import QueryProvider from '@/components/QueryProvider'
import DashboardContainer from '@/components/layout/DashboardContainer'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const lang = isLocale(locale) ? locale : DEFAULT_LOCALE
  const session = await requireAuth()

  // An admin's account is scoped to a single hotel — surface that hotel's name
  // in the sidebar. The owner isn't tied to one hotel, so this stays empty.
  let hotelName = ''
  if (session.role === 'admin' && session.hotelId) {
    await connectDB()
    const hotel = await Hotel.findById(session.hotelId).select('name').lean<{ name: string }>()
    hotelName = hotel?.name ?? ''
  }

  return (
    <LanguageProvider lang={lang}>
      <QueryProvider>
        <ToastProvider>
         <DraftProvider>
          <DashboardContainer userName={session.name} userEmail={session.email} role={session.role} hotelName={hotelName}>
            {children}
          </DashboardContainer>
         </DraftProvider>
        </ToastProvider>
      </QueryProvider>
    </LanguageProvider>
  )
}
