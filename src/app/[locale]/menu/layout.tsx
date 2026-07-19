import { DemoGuard } from '@/components/DemoGuard'

// Shared by the guest hub and its food sub-page. DemoGuard is a self-checking
// no-op everywhere except the `demo.` subdomain, where it fakes every mutating
// /api call (order placement, service requests) so the "Menu" demo product
// never writes real data — same guarantee the dashboard demo already has.
export default function GuestMenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoGuard />
      {children}
    </>
  )
}
