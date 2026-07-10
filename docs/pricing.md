# Pricing

## Where prices come from

An admin configures pricing on the **service** (or a service **variant**), as
`pricingGroups`: one group per **room type** or **client group**, each holding
`rows: { duration, price }[]`.

At booking time the guest picks a category (client group / room type), which
selects that group's rows.

## Rate × hours (current model)

Each configured row is read as an **hourly rate**, and the guest then chooses how
many hours. In `useBookingWizard.ts`:

```
ratePerHour = round(row.price / (row.duration / 60))   // a 1h/300 000 row → 300 000/hr
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

## ⚠️ Model inconsistency to be aware of

The **service form still stores `{duration, price}` rows**, but the booking flow
now interprets `price` as an hourly rate. An admin who enters "2h / 600 000" will
have it read as 300 000/hr. Planned fix: change the service pricing editor to
enter an explicit **hourly rate** (plus optional whole‑day price and min/max
hours) so the admin's intent matches what the guest is charged. Until then, enter
pricing rows as **1‑hour rates**.
