import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getSession, isCompanyExpired } from '@/lib/session'
import { connectDB } from '@/lib/mongodb'
import { Hotel } from '@/models/Hotel'
import { Company } from '@/models/Company'
import { ToastProvider } from '@/components/ToastProvider'
import { DraftProvider } from '@/components/DraftProvider'
import { BookingModalProvider } from '@/components/BookingModalProvider'
import DashboardContainer from '@/components/layout/DashboardContainer'
import { getSubdomain } from '@/lib/subdomain'

// The HOTEL ADMIN area: /secure/company/{slug}/admin/{hotelSlug}/...
// Same operational app as the owner's, but scoped to one hotel and without
// Settings (middleware.ts blocks /settings here; the sidebar hides it by role).
// middleware.ts already gates this tree — checks here are defense in depth.
export default async function HotelAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string; slug: string; hotelSlug: string }>
}) {
  const { locale, slug, hotelSlug } = await params
  const session = await getSession()
  if (
    !session || session.role !== 'admin' ||
    session.companySlug !== slug || session.hotelSlug !== hotelSlug
  ) {
    redirect(`/${locale}/secure/company/${slug}/admin/${hotelSlug}/login`)
  }

  await connectDB()
  const hotel = await Hotel.findById(session.hotelId).select('name').lean<{ name: string }>()
  const company = await Company.findById(session.companyId).select('expiresAt').lean<{ expiresAt: Date }>()
  const readOnly = !!company && isCompanyExpired(company.expiresAt)

  // Detect subdomain → clean basePath for the sidebar.
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const sub = getSubdomain(host)
  const basePath = sub === hotelSlug
    ? ''
    : (sub === 'app' || sub === 'demo')
      ? `/admin/${hotelSlug}`
      : `/secure/company/${slug}/admin/${hotelSlug}`

  return (
    <ToastProvider>
      <DraftProvider>
        <BookingModalProvider>
          <DashboardContainer
            userName={session.name}
            userEmail={session.email}
            role={session.role}
            basePath={basePath}
            hotelName={hotel?.name ?? ''}
            readOnly={readOnly}
          >
            {children}
          </DashboardContainer>
        </BookingModalProvider>
      </DraftProvider>
    </ToastProvider>
  )
}
