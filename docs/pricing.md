# Pricing

## Where prices come from

An admin configures pricing on the **service** (or a service **variant**), as
`pricingGroups`: one group per **room type** or **client group**, each holding
`rows: { duration, price }[]`. The pricing editor enters each row as an explicit
**rate per hour** (the `Rate per hour` field) and stores it as `duration: 60,
price: <rate>` — so what the admin types is exactly what the guest is charged per
hour. (`duration` is retained in the shape only for backward compatibility with
older, non‑1h rows.)

At booking time the guest picks a category (client group / room type), which
selects that group's rows.

## Rate × hours (current model)

Each configured row is read as an **hourly rate**, and the guest then chooses how
many hours. In `useBookingWizard.ts`:

```
ratePerHour = round(row.price / (row.duration / 60))   // duration is 60 → ratePerHour = price
```

Then:

- **N hours** → `duration = N × 60`, `price = ratePerHour × N`.
- **Whole day** → `duration = close − open`, `price = round(ratePerHour × dayHours)`.

The hours picker offers `1h … maxHours` (how many whole hours fit before closing)
plus **Whole day**. The plan section shows a live total.

`activePlan = { duration, price }` is the single derived value the rest of the
flow uses (time slots, review, submit).

## Custom / ungrouped

For a client with **no group** ("Custom"), or a `custom` booking type, price and
duration are entered manually (`customDuration`, `customPrice`) — no rate math.

## Free services

If a row's price (hence the total) is 0, the booking is treated as free: the
payment step shows "Free — no payment needed" and `paid` is forced false.

## Form ↔ booking alignment

The service pricing editor and the booking math now agree: the editor collects a
**rate per hour** and stores it as a `duration: 60` row, and the booking flow
reads that row's `price` directly as `ratePerHour`. There is no longer a
duration/price interpretation gap. Legacy rows whose `duration ≠ 60` are still
handled correctly by the `price / (duration/60)` derivation.

Not yet implemented: an explicit **whole‑day price** override and **min/max
hours** per group. Whole‑day currently derives from `rate × dayHours`, and the
hours picker offers `1h … maxHours` where `maxHours` is how many whole hours fit
before closing.
