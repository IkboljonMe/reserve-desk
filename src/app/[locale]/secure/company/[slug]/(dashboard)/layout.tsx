import { redirect } from 'next/navigation'
import { getSession, isCompanyExpired } from '@/lib/session'
import { connectDB } from '@/lib/mongodb'
import { Hotel } from '@/models/Hotel'
import { Company } from '@/models/Company'
import { ToastProvider } from '@/components/ToastProvider'
import { DraftProvider } from '@/components/DraftProvider'
import { BookingModalProvider } from '@/components/BookingModalProvider'
import QueryProvider from '@/components/QueryProvider'
import DashboardContainer from '@/components/layout/DashboardContainer'

// LanguageProvider is supplied by the parent [locale] layout, so the whole app
// (including login) shares it.
// proxy.ts already blocks unauthenticated/mismatched-tenant access to this
// tree — the checks here are defense in depth in case this layout is ever
// reached directly (e.g. a future server action).
export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const session = await getSession()
  if (!session || session.role === 'superadmin' || session.companySlug !== slug) {
    redirect(`/${locale}/secure/admin/${slug}/login`)
  }

  await connectDB()

  // An admin's account is scoped to a single hotel — surface that hotel's name
  // in the sidebar. The owner isn't tied to one hotel, so this stays empty.
  let hotelName = ''
  if (session.role === 'admin' && session.hotelId) {
    const hotel = await Hotel.findById(session.hotelId).select('name').lean<{ name: string }>()
    hotelName = hotel?.name ?? ''
  }

  const company = await Company.findById(session.companyId).select('expiresAt').lean<{ expiresAt: Date }>()
  const readOnly = !!company && isCompanyExpired(company.expiresAt)

  return (
    <QueryProvider>
      <ToastProvider>
       <DraftProvider>
        <BookingModalProvider>
         <DashboardContainer userName={session.name} userEmail={session.email} role={session.role} slug={slug} hotelName={hotelName} readOnly={readOnly}>
           {children}
         </DashboardContainer>
        </BookingModalProvider>
       </DraftProvider>
      </ToastProvider>
    </QueryProvider>
  )
}
