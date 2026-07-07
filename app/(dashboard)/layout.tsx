import { requireAuth } from '@/lib/session'
import { ToastProvider } from '@/components/ToastProvider'
import { DraftProvider } from '@/components/DraftProvider'
import { LanguageProvider } from '@/lib/i18n'
import QueryProvider from '@/components/QueryProvider'
import DashboardContainer from '@/components/layout/DashboardContainer'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth()

  return (
    <LanguageProvider>
      <QueryProvider>
        <ToastProvider>
         <DraftProvider>
          <DashboardContainer userName={session.name} userEmail={session.email}>
            {children}
          </DashboardContainer>
         </DraftProvider>
        </ToastProvider>
      </QueryProvider>
    </LanguageProvider>
  )
}
