# Data models

Mongoose schemas in `src/models/`. MongoDB via `connectDB()`
(`src/lib/mongodb.ts`). Relationships are by `ObjectId` reference.

```
Hotel ──< Room
Hotel ──< Service ──(sharedHotelIds)── Hotel      (a service can be shared to other hotels)
Service ──< Booking >── Client                    (a booking may reference a saved client)
ClientGroup ──< Client
Admin (owner | admin)  ──creates──> Booking
Hotel ──< Contract
Service ──1:1── TelegramTopic   (a forum topic per hotel+service)
```

## Hotel (`Hotel.ts`)
`name`, `shortName` (compact code shown on rooms, e.g. `FG`), `location`,
`roomTypes: string[]` (category names used by rooms and room‑pricing).

## Room (`Room.ts`)
`hotelId`, `number`, `floor`, `type` (one of the hotel's `roomTypes`). Displayed
as `${hotel.shortName}-${number}` (e.g. `FG-202`).

## Service (`Service.ts`)
The bookable resource. Key fields:

- Identity: `name`, `icon`, `color`, `description`, `details`, `isActive`.
- Ownership: `hotelId` (owner) + `sharedHotelIds[]` (other hotels that may book
  the same single resource).
- Hours: `openTime`/`closeTime` (`"HH:mm"`), `slotDuration`.
  - `weeklyHours: { day (0=Sun…6=Sat), open, close, closed }[]` — per‑weekday
    overrides. Empty means the flat `openTime`/`closeTime` apply every day.
  - `blackoutDates: "YYYY-MM-DD"[]` — specific dates the service is fully closed.
  - `src/lib/serviceHours.ts` (`hoursForDate`) resolves these into one
    `{ open, close, closed }` per date, used by both booking validation and slot
    generation. See [booking-and-availability.md](./booking-and-availability.md).
- Capacity & buffers: `capacity` (how many can be booked concurrently — **note:
  the availability check currently treats this as 1**), `bufferTimeBefore`,
  `bufferTimeAfter` (prep/cleaning minutes reserved around each booking).
- Pricing (see [pricing.md](./pricing.md)):
  - `pricingPlans: {duration, price}[]` — legacy flat plans.
  - `pricingGroups: { target: 'room'|'client', category, rows: {duration,price}[] }[]`
    — per room‑type or per client‑group pricing.
  - `variants: { id, name, pricingPlans, pricingGroups }[]` — named
    configurations of the same resource (e.g. "Half pool" vs "Whole pool"); only
    one variant occupies the resource at a time, they exist to price differently.

## Client (`Client.ts`) / ClientGroup (`ClientGroup.ts`)
A saved guest: `name`, `phone`, `roomNumber`, `floor`, `notes`, `groupId`
(→ ClientGroup). Groups are colored labels (e.g. VIP) used both to organize
clients and to select a pricing group at booking time.

The clients table's **history** action opens a per‑client booking history
(`ClientHistoryModal`) — visits, total spent, outstanding, last visit, and the
list — backed by `GET /api/bookings?clientId=<id>` (a `clientId` filter on the
bookings list).

## Booking (`Booking.ts`)
The core record.

- Who/what: `hotelId` (owner hotel the revenue is attributed to),
  `bookedByHotelId` (the hotel that actually made it — differs for shared
  services), `serviceId`, `clientId?`, `customerName`, `customerPhone`,
  `roomNumber`, `variantId?`/`variantName?`, `notes` (free-text), `menu` +
  `menuReadyTime` (optional food/order request and its "HH:mm" ready-by time —
  e.g. for a SPA & Pool event — shown in the Telegram message when set).
- When: `date` (`YYYY-MM-DD`), `startTime`, `endTime`, `bufferedEndTime`,
  `duration` (minutes), `persons` (party size, default 1).
- Money/state: `totalPrice`, `amountPaid` (money collected so far — a value
  between 0 and `totalPrice` is a **deposit**), `paid` (derived: true once
  `amountPaid ≥ totalPrice`), `finished`, `status`
  (`confirmed|pending|cancelled`), `paidAt?`, `finishedAt?`.
- Classification: `bookingType` (`client|room|custom`), `category` (client‑group
  id or room type).
- Audit: `history: { action, at, by, detail? }[]` — every
  create/paid/payment/finished/notes/reopen event, shown in the booking drawer
  timeline. A `payment` event records a deposit (its `detail` holds the running
  collected amount).
- Telegram link: `tgChatId?`, `tgMessageId?`, `tgThreadId?` — where the booking's
  Telegram message lives, so status changes edit it instead of duplicating.
- `createdBy` → Admin.

> The model file ends with `delete mongoose.models.Booking` before re‑registering,
> so schema changes are always picked up in dev without a restart.

## Admin (`Admin.ts`)
Staff login: `email`, `password` (bcrypt‑hashed by a pre‑save hook), `name`,
`role`, `hotelId?`. Roles: **owner** (no hotel; sees everything) and **admin**
(scoped to one `hotelId`). See [auth-and-roles.md](./auth-and-roles.md).

## Contract (`Contract.ts`)
Partner‑organization agreements with `finishDate` and `reminderDays`. Drives the
Notifications page (renewal reminders); unrelated to service bookings.

## Telegram models
- `TelegramConfig` — the connected group chat (`groupChatId`).
- `TelegramTopic` — one forum topic per `(hotelId, serviceId)` with its
  `messageThreadId`.
- `TelegramSession` — bot conversation state for setup commands.

See [telegram.md](./telegram.md).
