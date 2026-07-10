# Dashboard & calendar

## Dashboard (`src/features/dashboard/`)

Two zones, driven by `useDashboardPage.ts`:

1. **Income analytics** (`IncomeAnalytics`) over a chosen **period** (week,
   month, 7d, 30d, custom). It buckets bookings by day (or by week when the span
   is large) and shows:
   - **Total income** = Σ `totalPrice` in range.
   - **Collected** = Σ `amountCollected(b)` — the money actually in hand,
     including partial **deposits** (legacy records fall back to
     `paid ? totalPrice : 0`).
   - **Outstanding** = total − collected.
   - A per‑service breakdown and a bar chart (`IncomeChart`).
   Values animate via `useCountUp`.
2. **Bookings explorer** — a filterable, sortable table of the range's bookings
   with filters (hotels, services, payment, type, state) and search. **Export to
   Excel** (`xlsx`) is available. Clicking a row opens the **booking drawer**.

Cancelled and *masked* bookings (other hotels' bookings on a shared service) are
excluded from totals. `serviceHotel` maps each service to its owner hotel for
attribution.

### Booking drawer (`BookingDrawer`)

Details + lifecycle actions for one booking: **Mark as paid** (with a
confirmation), **Mark as finished**, edit **notes**, **delete**, and an
**activity timeline** built from `booking.history`. Actions call
`PUT /api/bookings/[id]`; the parent list is patched optimistically via React
Query.

## Calendar (`src/features/calendar/`)

`useCalendarPage.ts` drives it. **Day / Week / Month** views:

- **Week/Day** → `TimeGrid` (hour rows; density S/M/L controls row height).
- **Month** → `MonthView`.

Bookings for the visible range come from `useBookingsQuery(from, to)`. A sidebar
filters by **hotel** and **service** (with per‑item counts) and shows a range
**summary** (count, revenue, collected/due). The top filters are **search** +
**status** (`all/unpaid/paid/finished`).

Clicking a booking opens `BookingDetailModal` (status, guest, room, time, price,
payment) with **Mark as Paid / Collect balance** (→ `PayConfirmModal`), **Mark as
Finished**, and **delete**. "New" and empty grid cells route to the booking
wizard with the date prefilled.

`PayConfirmModal` records a payment: the "amount received" defaults to the full
remaining balance, but a smaller value books a **deposit**. It calls
`recordPayment(booking, newCollectedTotal)`, which flips `paid` true only once the
collected amount covers `totalPrice`.

Booking state → label/color is centralized in `lib/bookingHelpers.ts`
(`bookingState()` → `finished | paid | partial | unpaid | free`, where `partial`
is a booking with a deposit but a remaining balance); the UI translates via the
`st.key` (`t(st.key)`). `amountCollected` / `amountDue` / `isPartiallyPaid`
helpers live alongside it.

## Notifications (`src/features/notifications/`)

Contract renewal reminders (not service bookings): grouped by urgency
(expired / ≤7d / ≤30d), each dismissable. Backed by `Contract.reminderDays` and
`lib/notifications.ts`. The sidebar badge shows the open count.
