"use client";

import { useCalendarPage } from "./useCalendarPage";
// import { useIsMobile } from '@/hooks/useIsMobile'
import { CalendarToolbar } from "./components/CalendarToolbar";
import { CalendarGrid } from "./components/CalendarGrid";
import { BookingDetailModal } from "./components/BookingDetailModal";
import { PayConfirmModal } from "./components/PayConfirmModal";
import { EditBookingModal } from "./components/EditBookingModal";

export default function CalendarPage() {
  const s = useCalendarPage();
  // const isMobile = useIsMobile()

  return (
    <div className="flex flex-col h-full min-h-0 -mx-8 max-[860px]:mx-[-1.1rem] max-[860px]:h-auto">
      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="px-8 max-[860px]:px-[1.1rem]">
          <CalendarToolbar s={s} />
        </div>
        <CalendarGrid s={s} />
      </div>

      <BookingDetailModal s={s} />
      <PayConfirmModal s={s} />
      {s.editBooking && <EditBookingModal key={s.editBooking._id} s={s} />}
    </div>
  );
}
