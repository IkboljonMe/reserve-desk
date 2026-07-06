import { requireAuth } from '@/lib/session'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { ToastProvider } from '@/components/ToastProvider'
import { LanguageProvider } from '@/lib/i18n'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth()

  return (
    <LanguageProvider>
      <ToastProvider>
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
          <Sidebar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Header userName={session.name} userEmail={session.email} />
            <main style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
              {children}
            </main>
          </div>
        </div>
      </ToastProvider>
    </LanguageProvider>
  )
}
