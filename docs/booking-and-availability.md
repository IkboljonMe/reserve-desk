# Booking flow & availability

"New Booking" is a modal (`BookingModal`, `src/features/book/`), not a routed
page — `/book` now just redirects to `/calendar`. It's opened from the
sidebar, the dashboard header, or the calendar (toolbar button or clicking an
empty slot) via `useBookingModal()` (`src/components/BookingModalProvider.tsx`),
which mounts the modal app-wide so any page can trigger it and pass a
`date`/`time` prefill. All wizard state is in the one hook
`useBookingWizard.ts`; each slide component is presentational.

## The wizard

One slide per concern, navigated with Back/Next in the modal's footer
(`slides` / `slideIndex` in the hook — `hotel` is dropped from the sequence
entirely for single-hotel admins, who are auto-scoped):

1. **Hotel** (`HotelStep`) — auto‑selected for admins (single hotel); a picker for the owner.
2. **Service** (`ServiceStep`) — the hotel's active services (owned or shared to it).
   - **Variant** — if the service has `variants`, pick one first; its pricing
     replaces the service's own.
3. **Plan** (`PlanSection`) — **who is it for?** (`bookingType`):
   - `client` — pick a client **group** (VIP…), or "Custom" (ungrouped, manual
     price). Then search/pick or add a saved client.
   - `room` — pick a room **type**, then the specific room.
   - `custom` — one‑off, manual duration + price.
   - **Rate + hours** — see [pricing.md](./pricing.md).
4. **Guest** (`GuestSection`) — guest/room details (name, phone, room number,
   notes), plus an optional `menu`/`menuReadyTime` field for a food/order
   request (e.g. for a SPA & Pool event) and when it should be ready.
5. **Date & time** (`DateTimeSection`) — a date input plus the available start‑time slots.
6. **Review** (`ReviewStep`) — read‑only summary, headcount, payment toggle, confirm.

Each slide gates the "Next" button on its own validity (`slideValid` in the
hook); `Hotel`/`Service` auto-advance on a single tap since there's nothing
else to fill in on those slides. `confirmBooking()` uses
`useCreateBookingMutation()` so the dashboard/calendar underneath refreshes
via react-query cache invalidation once the modal closes — there's no page
navigation involved.

`confirmBooking()` posts to `POST /api/bookings` with `serviceId`, `date`,
`startTime`, `endTime`, `duration`, `totalPrice`, guest fields (including
`menu`/`menuReadyTime`), `bookingType`, `category`, `variantId`. When set,
`menu`/`menuReadyTime` are also included in the Telegram notification
(`buildBookingMessage()` in `src/lib/telegram.ts`) and editing them later
(via the calendar's edit modal or the dashboard's booking drawer) edits that
Telegram message in place, same as other guest-detail changes.

## Opening hours per date

The service's window for the chosen **date** comes from
`src/lib/serviceHours.ts › hoursForDate(service, date)`:

1. If `date` is in `blackoutDates` → **closed**.
2. Else if `weeklyHours` has an entry for that weekday → use it (which may itself
   be `closed`, or carry its own open/close).
3. Else fall back to the flat `openTime`/`closeTime`.

When the result is `closed`, the wizard shows "closed on this date" and offers no
slots. Otherwise the resolved `open`/`close` feed slot generation below.

## Time‑slot generation

`utils.ts › generateTimeSlots(open, close, duration)` (fed the resolved hours):

- Start at `open`, snapped up to the next 15‑minute boundary.
- Step by **15 minutes**; a slot is valid while `start + duration <= close`.
- Returns the list of candidate **start** times.

So a 2‑hour booking in an 08:00–22:00 window offers starts every 15 min from
08:00 up to 20:00.

## Availability (the overlap / buffer rule)

`useBookingWizard` derives `availableSlots` by filtering the candidate starts
against the day's existing bookings for this service (`dayBookings`, fetched via
`GET /api/bookings?dateFrom=…&dateTo=…` and filtered to the service):

```
candidate reserves [start - bufferBefore, end + bufferAfter]
a slot is available  ⇔  no existing booking b overlaps it:
    NOT ( b.start < end + bufferAfter  AND  b.end > start - bufferBefore )
```

Only **available** slots are shown, each rendered as `start → end` (e.g.
`12:00 → 14:00`). "Whole day" produces a single `open → close` slot, available
only if the day is otherwise free.

**Capacity:** a service can host up to `Service.capacity` bookings at once. A
start is offered while *fewer than* `capacity` existing bookings overlap the
candidate window (`overlaps < capacity`). With the default `capacity = 1` this is
the exclusive‑resource behavior above; with e.g. `capacity = 5` a pool can take
five concurrent bookings before a slot is full. The server enforces the same
rule with `countDocuments` and returns **409** once the slot is full.

Worked example (buffer = 15 min, existing booking 12:00–13:00):
- 2‑hour start at **11:00** → reserves `[10:45, 13:15]`, which overlaps 12:00–13:00
  → **not offered**.
- 2‑hour start at **13:15** → reserves `[13:00, 15:30]`, `b.end (13:00) > 13:00`
  is false → **available** (the 15‑min gap is enforced).

## Server‑side check

`POST /api/bookings` re‑derives the buffered window from the submitted
`start/end` and rejects an overlapping booking, so a stale client snapshot can't
double‑book. It also rejects a booking whose date resolves to **closed**
(`hoursForDate`). `PUT /api/bookings/[id]` runs both checks (overlap + closed) when
a booking is rescheduled — see [dashboard-and-calendar.md](./dashboard-and-calendar.md).
The client mirrors the same rules for the live UI.

## Known limitations (see the improvement backlog)

- The overlap compares the candidate's *buffered* window against each existing
  booking's *raw* range; it's symmetric only because all bookings share the
  service buffer.
- Availability is computed from a per‑day snapshot; the server returns a 409 on
  conflict, which the wizard currently surfaces as a toast rather than inline.
