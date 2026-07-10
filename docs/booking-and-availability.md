# Booking flow & availability

The new‑booking screen lives in `src/features/book/`. All state is in the one
hook `useBookingWizard.ts`; the sections are presentational.

## The wizard

Two macro steps (`step` 1 = select, 2 = review):

1. **Select** (`SelectStep` → `PlanSection` → `GuestSection` → `DateTimeSection`):
   - **Hotel** — auto‑selected for admins (single hotel); a picker for the owner.
   - **Service** — the hotel's active services (owned or shared to it).
   - **Variant** — if the service has `variants`, pick one first; its pricing
     replaces the service's own.
   - **Who is it for?** (`bookingType`):
     - `client` — pick a client **group** (VIP…), or "Custom" (ungrouped, manual
       price). Then search/pick or add a saved client.
     - `room` — pick a room **type**, then the specific room.
     - `custom` — one‑off, manual duration + price.
   - **Rate + hours** — see [pricing.md](./pricing.md).
   - **Date & time** — a date input plus the available start‑time slots.
2. **Review** (`ReviewStep`) — read‑only summary, payment toggle, confirm.

`confirmBooking()` posts to `POST /api/bookings` with `serviceId`, `date`,
`startTime`, `endTime`, `duration`, `totalPrice`, guest fields, `bookingType`,
`category`, `variantId`.

## Time‑slot generation

`utils.ts › generateTimeSlots(openTime, closeTime, duration)`:

- Start at `openTime`, snapped up to the next 15‑minute boundary.
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
double‑book. The client mirrors the same rule for the live UI.

## Known limitations (see the improvement backlog)

- The overlap compares the candidate's *buffered* window against each existing
  booking's *raw* range; it's symmetric only because all bookings share the
  service buffer.
- Availability is computed from a per‑day snapshot; the server returns a 409 on
  conflict, which the wizard currently surfaces as a toast rather than inline.
