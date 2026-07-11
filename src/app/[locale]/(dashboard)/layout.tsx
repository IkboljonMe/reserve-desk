import { requireAuth } from '@/lib/session'
import { connectDB } from '@/lib/mongodb'
import { Hotel } from '@/models/Hotel'
import { ToastProvider } from '@/components/ToastProvider'
import { DraftProvider } from '@/components/DraftProvider'
import { BookingModalProvider } from '@/components/BookingModalProvider'
import QueryProvider from '@/components/QueryProvider'
import DashboardContainer from '@/components/layout/DashboardContainer'

// LanguageProvider is supplied by the parent [locale] layout, so the whole app
// (including login) shares it.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
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
    <QueryProvider>
      <ToastProvider>
       <DraftProvider>
        <BookingModalProvider>
         <DashboardContainer userName={session.name} userEmail={session.email} role={session.role} hotelName={hotelName}>
           {children}
         </DashboardContainer>
        </BookingModalProvider>
       </DraftProvider>
      </ToastProvider>
    </QueryProvider>
  )
}
