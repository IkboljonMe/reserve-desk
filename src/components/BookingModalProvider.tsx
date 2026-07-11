'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { BookingModal } from '@/features/book/components/BookingModal'

interface BookingPrefill {
  date?: string
  time?: string
}

interface BookingModalContextValue {
  openBookingModal: (prefill?: BookingPrefill) => void
}

const BookingModalContext = createContext<BookingModalContextValue | null>(null)

/**
 * Hosts the "New Booking" wizard as a single, app-wide modal instance so any
 * page (dashboard, calendar, sidebar nav) can open it via `openBookingModal()`
 * instead of navigating to a dedicated route. The wizard itself remounts
 * fresh every time it opens, so no explicit reset is needed between uses.
 */
export function BookingModalProvider({ children }: { children: React.ReactNode }) {
  const [prefill, setPrefill] = useState<BookingPrefill | null>(null)

  const openBookingModal = useCallback((p?: BookingPrefill) => {
    setPrefill(p ?? {})
  }, [])

  const close = useCallback(() => setPrefill(null), [])

  return (
    <BookingModalContext.Provider value={{ openBookingModal }}>
      {children}
      {prefill && (
        <BookingModal initialDate={prefill.date} initialTime={prefill.time} onClose={close} />
      )}
    </BookingModalContext.Provider>
  )
}

export function useBookingModal() {
  const ctx = useContext(BookingModalContext)
  if (!ctx) throw new Error('useBookingModal must be used within a BookingModalProvider')
  return ctx
}
