---
tags: [plans, api, reference, backend]
date: 2026-07-12
---

# API v1 — Endpoint Reference (living document)

Related: [[MOC]] · [[API-Design]] (conventions, auth, error envelope — read it first) · [[Backend-and-Telegram-Bot]]

> **How to maintain this document:** every endpoint change lands here *before* it lands in code. Each endpoint section is self-contained (auth → request → response → errors) so a section can be rewritten without touching the rest. Conventions (pagination envelope, error envelope, auth types) are defined once in [[API-Design]] §3 and not repeated per endpoint.

**Hosts**

| Host | Serves |
|---|---|
| `{company-slug}.easy-service.uz` | Tenant API (§3–§13) — tenant resolved from subdomain |
| `superadmin.easy-service.uz` | Platform API (§2) + auth (§1.1) |
| `bot.easy-service.uz` (or Nginx path route) | Bot service public webhook only (§15.1) |
| `127.0.0.1:3001` (loopback only) | Bot service internal API (§15.2) |

**Auth legend** — `S:role` = session cookie with that role · `K` = API key (company-scoped) · `K-plat` = platform API key (superadmin-issued) · `I` = `X-Internal-Secret` header · `T` = Telegram `X-Telegram-Bot-Api-Secret-Token` header. Where both `S` and `K` are listed, an API key acts with owner-level permissions unless created read-only.

---

## §0. Error code catalog

All errors use the envelope from [[API-Design]] §3.3. Codes are stable API contract — never rename, only add.

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `BAD_REQUEST` | Malformed JSON, missing required query param |
| 401 | `UNAUTHENTICATED` | No/expired/invalid session or API key |
| 401 | `SESSION_REVOKED` | JWT valid but `sessionVersion` stale (password changed / logged out everywhere / account deactivated) |
| 403 | `FORBIDDEN` | Authenticated but role not allowed for this endpoint |
| 403 | `TENANT_MISMATCH` | Session/key belongs to a different company than the subdomain |
| 403 | `PLAN_EXPIRED` | Company plan expired — writes blocked, reads still allowed |
| 403 | `HOTEL_SCOPE` | Admin attempted to act outside their hotel |
| 404 | `NOT_FOUND` | Resource doesn't exist *or* isn't visible to this tenant (deliberately indistinguishable) |
| 404 | `UNKNOWN_TENANT` | Subdomain doesn't match any company slug |
| 409 | `SLOT_FULL` | Booking overlaps; capacity exhausted for that window |
| 409 | `SERVICE_CLOSED` | Requested date is a blackout/closed weekday for the service |
| 409 | `DUPLICATE` | Unique constraint (slug taken, room number exists in hotel, group name exists, email registered) |
| 409 | `HAS_DEPENDENTS` | Delete blocked: resource still has children (e.g. hotel with rooms/bookings) — `details.counts` says what |
| 410 | `GONE` | Legacy `/api/*` endpoint after decommission (Phase 4) |
| 422 | `VALIDATION_FAILED` | Body failed zod validation — `details` maps field → message |
| 429 | `RATE_LIMITED` | See `Retry-After` header |
| 500 | `INTERNAL` | Unexpected; `requestId` is the support handle |
| 502 | `NOTIFY_FAILED` | (bot internal API only) Telegram API rejected the send after retries |

---

## §1. Auth & session

### 1.1 `POST /api/v1/auth/login`
Any tenant subdomain (owner/admin) or the superadmin subdomain (superadmin only). No auth. Rate limit: 5/min per IP **and** per email.

Request:
```json
{ "email": "owner@safir.uz", "password": "••••••••" }
```
The company is implied by the subdomain — the old body `slug` field is gone. Login is rejected (`401 UNAUTHENTICATED`, same message as bad password — no account enumeration) when: credentials are wrong; the account's `companyId` doesn't match the subdomain's company; a superadmin tries a tenant subdomain or vice versa.

`200` — sets the session cookie, returns the session descriptor:
```json
{
  "user": { "id": "665f0a…", "email": "owner@safir.uz", "name": "Safir Owner", "role": "owner" },
  "company": { "id": "665f09…", "slug": "safir-group-mchj", "name": "Safir Group MCHJ", "plan": "pro", "expiresAt": "2027-01-01T00:00:00Z" },
  "hotel": null,
  "home": "/dashboard"
}
```
For an admin, `hotel` carries `{ id, slug, name }` and `home` is their calendar. Errors: `VALIDATION_FAILED`, `UNAUTHENTICATED`, `UNKNOWN_TENANT`, `RATE_LIMITED`.

### 1.2 `POST /api/v1/auth/logout` — auth `S:any`
Clears the cookie. `204`. Idempotent (also `204` with no session).

### 1.3 `GET /api/v1/auth/session` — auth `S:any` | `K`
Who am I — same body as the login `200`. The SPA calls this on boot instead of decoding the cookie client-side. Errors: `UNAUTHENTICATED`, `SESSION_REVOKED`.

### 1.4 `PUT /api/v1/auth/password` — auth `S:any`
```json
{ "currentPassword": "…", "newPassword": "…" }
```
`204`. Bumps `sessionVersion` → all *other* sessions die; this one gets a fresh cookie in the response. Errors: `VALIDATION_FAILED` (min length 8), `UNAUTHENTICATED` (wrong current password).

### 1.5 `POST /api/v1/auth/logout-all` — auth `S:any`
Bumps `sessionVersion` without changing the password ("log out everywhere"). `204`.

---

## §2. Platform API — superadmin host only

Everything in §2 exists **only** on `superadmin.easy-service.uz`; on tenant hosts these paths are `404 NOT_FOUND`.

### 2.1 `GET /api/v1/companies` — auth `S:superadmin` | `K-plat`
Query: `?search=` (name/slug substring) · `?plan=standard|pro|vip` · `?expired=true|false` · `?page&limit&sort` (sortable: `createdAt`, `expiresAt`, `name`). Paginated envelope of:
```json
{
  "id": "665f09…", "name": "Safir Group MCHJ", "slug": "safir-group-mchj",
  "plan": "pro", "expiresAt": "2027-01-01T00:00:00Z",
  "contactName": "A. Safirov", "contactPhone": "+99890…", "paymentMethod": "bank transfer",
  "counts": { "hotels": 3, "admins": 7, "bookings30d": 412 },
  "createdAt": "2026-07-12T09:00:00Z", "updatedAt": "2026-07-12T09:00:00Z"
}
```

### 2.2 `POST /api/v1/companies` — auth `S:superadmin` | `K-plat`
Creates the company **and its owner account atomically** (one transaction — today these are separate steps that can half-fail):
```json
{
  "name": "Safir Group MCHJ",
  "slug": "safir-group-mchj",
  "plan": "pro",
  "expiresAt": "2027-01-01",
  "contactName": "A. Safirov", "contactPhone": "+99890…", "paymentMethod": "bank transfer",
  "owner": { "email": "owner@safir.uz", "name": "Safir Owner", "password": "…" }
}
```
`slug` must match `^[a-z0-9]+(-[a-z0-9]+)*$` and not be reserved (`RESERVED_SLUGS` in `src/models/Company.ts` — extend it with the subdomain reserved list from [[VPS-Setup-and-Cloudflare]] §7: `superadmin`, `www`, `bot`, `mail`, `cdn`, …). The subdomain `safir-group-mchj.easy-service.uz` is live immediately (wildcard DNS — no provisioning step). `201` returns the §2.1 shape plus `owner: { id, email }`. Errors: `VALIDATION_FAILED`, `DUPLICATE` (slug or owner email).

### 2.3 `GET /api/v1/companies/{id}` — auth `S:superadmin` | `K-plat`
§2.1 shape with full counts (`hotels`, `admins`, `rooms`, `services`, `bookings`, `clients`, `contracts`).

### 2.4 `PUT /api/v1/companies/{id}` — auth `S:superadmin` | `K-plat`
Updatable: `name`, `slug` (revalidated; changing it changes the tenant's URL — the response includes `"warning": "SLUG_CHANGED"`), `contactName`, `contactPhone`, `paymentMethod`, `plan`. **Not** `expiresAt` — renewal is its own action (2.5) so it's always an audited event. `200` → §2.1 shape.

### 2.5 `POST /api/v1/companies/{id}/renew` — auth `S:superadmin` | `K-plat`
```json
{ "expiresAt": "2028-01-01", "note": "paid invoice #2214" }
```
Must be later than the current `expiresAt`. `200` → updated company. This is the endpoint a future billing integration calls.

### 2.6 `DELETE /api/v1/companies/{id}` — auth `S:superadmin` only (never API key)
Cascade-deletes the tenant (hotels, admins, rooms, services, bookings, clients, groups, contracts, telegram config/topics) inside a transaction — the current implementation already cascades; v1 wraps it transactionally. Requires header `X-Confirm-Delete: {slug}` (typed confirmation, since this is unrecoverable except from Atlas backup). `200`:
```json
{ "deleted": { "hotels": 3, "admins": 7, "rooms": 120, "services": 9, "bookings": 4210, "clients": 380, "clientGroups": 4, "contracts": 12 } }
```

### 2.7 `GET /api/v1/platform/stats` — auth `S:superadmin` | `K-plat`
Dashboard numbers: `{ companies: { total, byPlan, expired }, bookings: { today, last30d }, topCompanies: [{ id, name, bookings30d }] }`.

---

## §3. API keys

Owner-issued, company-scoped (on tenant host); superadmin-issued, platform-scoped (on superadmin host). Same endpoints, host decides the scope.

### 3.1 `GET /api/v1/api-keys` — auth `S:owner` / `S:superadmin`
Plain array: `{ id, label, prefix: "rk_live_8fk2", scope: "full"|"read", lastUsedAt, createdAt }`. Never returns the key material.

### 3.2 `POST /api/v1/api-keys` — auth `S:owner` / `S:superadmin` (session only — a key cannot mint keys)
```json
{ "label": "bot callbacks", "scope": "full" }
```
`201` — **the only time the secret is shown**:
```json
{ "id": "…", "label": "bot callbacks", "scope": "full", "key": "rk_live_8fk2J9x…(60 chars)" }
```
Stored as SHA-256 hash. Max 10 active keys per scope.

### 3.3 `DELETE /api/v1/api-keys/{id}` — auth `S:owner` / `S:superadmin`
`204`. Takes effect on the key's next request (hash lookup fails).

---

## §4. Hotels — tenant host

### 4.1 `GET /api/v1/hotels` — auth `S:owner|admin` | `K`
Plain array (bounded collection). Owner: all hotels; admin: only their own.
```json
{ "id": "…", "name": "Fergana Grand Hotel", "shortName": "FG", "slug": "fergana-grand",
  "location": "Fergana, Uzbekistan", "roomTypes": ["Standard", "Middle", "Lux"],
  "createdAt": "…", "updatedAt": "…" }
```

### 4.2 `POST /api/v1/hotels` — auth `S:owner` | `K`
Required: `name`, `shortName` (uppercased, unique per company). Optional: `slug` (defaults from name), `location`, `roomTypes[]`. `201` → 4.1 shape. Errors: `DUPLICATE` (shortName/slug within company), `PLAN_EXPIRED`.

### 4.3 `GET /api/v1/hotels/{id}` — auth `S:owner|admin` | `K` — admin only their own hotel (`HOTEL_SCOPE`).

### 4.4 `PUT /api/v1/hotels/{id}` — auth `S:owner` | `K`
Same fields as 4.2. Removing a value from `roomTypes` that rooms still use → `409 HAS_DEPENDENTS` with `details.rooms`.

### 4.5 `DELETE /api/v1/hotels/{id}` — auth `S:owner` | `K`
Refuses (`409 HAS_DEPENDENTS`, `details.counts`) while the hotel has rooms, services, admins, or future bookings; delete/move those first. (Deliberate contrast with company delete, which is superadmin-only and cascading.)

---

## §5. Staff accounts (`admins`) — tenant host

### 5.1 `GET /api/v1/admins` — auth `S:owner` | `K`
Plain array: `{ id, email, name, role: "admin", hotel: { id, name, slug }, active, lastLoginAt, createdAt }`. (Owner account itself managed via §1, not listed here.)

### 5.2 `POST /api/v1/admins` — auth `S:owner` | `K`
```json
{ "email": "reception@safir.uz", "name": "Aziza", "password": "…", "hotelId": "…" }
```
`hotelId` must belong to the company. `201`. Errors: `DUPLICATE` (email is globally unique), `VALIDATION_FAILED`, `NOT_FOUND` (hotelId).

### 5.3 `PUT /api/v1/admins/{id}` — auth `S:owner` | `K`
Updatable: `name`, `hotelId` (reassign to another of the company's hotels), `password` (optional; setting it bumps the admin's `sessionVersion` → their sessions die), `active: false` (soft deactivation — login blocked, `sessionVersion` bumped, history/`createdBy` references stay intact).

### 5.4 `DELETE /api/v1/admins/{id}` — auth `S:owner` | `K`
Hard delete. Prefer `active: false` when the person may return or has audit references. `204`.

---

## §6. Rooms — tenant host

### 6.1 `GET /api/v1/rooms` — auth `S:owner|admin` | `K`
Query: `?hotelId=` (owner; admins are forced to their own) · `?floor=` · `?type=`. Paginated; sorted `floor, order, number` by default.
```json
{ "id": "…", "hotelId": "…", "number": "202", "floor": 2, "order": 3,
  "type": "Lux", "description": "", "createdAt": "…", "updatedAt": "…" }
```

### 6.2 `POST /api/v1/rooms` — auth `S:owner` | `K`
Required: `hotelId`, `number`, `floor`. Optional: `type` (should be one of the hotel's `roomTypes`), `description`. Errors: `DUPLICATE` (number within hotel).

### 6.3 `PUT /api/v1/rooms/{id}` / `DELETE …` — auth `S:owner` | `K`. Delete is allowed even with historical bookings (bookings store `roomNumber` as a string snapshot, not a reference).

### 6.4 `PUT /api/v1/rooms/order` — auth `S:owner` | `K`
Replaces the RPC-ish `/rooms/reorder`. Body: `{ "hotelId": "…", "floor": 2, "roomIds": ["id1","id2","id3"] }` — full ordered list for one hotel+floor; server assigns `order` 0..n. `204`. Errors: `VALIDATION_FAILED` if any id isn't in that hotel+floor.

---

## §7. Services — tenant host

### 7.1 `GET /api/v1/services` — auth `S:owner|admin` | `K`
Plain array. Owner: all; admin: services their hotel owns **or** that are shared with it (`sharedHotelIds`). Full model shape:
```json
{
  "id": "…", "name": "SPA & Pool", "icon": "pool", "color": "#6366f1", "isActive": true,
  "hotelId": "…", "sharedHotelIds": ["…"],
  "openTime": "08:00", "closeTime": "22:00",
  "weeklyHours": [ { "day": 1, "open": "10:00", "close": "20:00", "closed": false } ],
  "blackoutDates": ["2026-08-15"],
  "slotDuration": 60, "capacity": 2, "bufferTimeBefore": 15, "bufferTimeAfter": 15,
  "price": 200000, "isFree": false, "description": "", "details": "",
  "pricingPlans": [ { "duration": 60, "price": 200000 } ],
  "pricingGroups": [ { "target": "room", "category": "Lux", "rows": [ { "duration": 60, "price": 150000 } ] } ],
  "variants": [ { "id": "half", "name": "Half pool", "pricingPlans": [], "pricingGroups": [] } ],
  "createdAt": "…", "updatedAt": "…"
}
```

### 7.2 `POST /api/v1/services` — auth `S:owner` | `K` — required: `name`, `hotelId`; everything else defaults as in the model. `201`.

### 7.3 `GET /api/v1/services/{id}` — auth `S:owner|admin` | `K` (admin: own/shared only, else `NOT_FOUND`).

### 7.4 `PUT /api/v1/services/{id}` — auth `S:owner` | `K`
Full-shape update. Removing a variant that historical bookings reference is allowed (bookings snapshot `variantName`); the reference doc for the UI should warn. Shrinking `capacity` below existing overlapping bookings is allowed (affects future validation only).

### 7.5 `DELETE /api/v1/services/{id}` — auth `S:owner` | `K`
`409 HAS_DEPENDENTS` if future non-cancelled bookings exist (`details.futureBookings`); otherwise deletes and tells the bot service to drop the Telegram topic (§15.2.4). `204`.

### 7.6 `GET /api/v1/services/{id}/availability?date=2026-07-15` — auth `S:owner|admin` | `K`
**New** — server-computed slots so clients stop re-implementing hours/buffer/capacity math:
```json
{
  "date": "2026-07-15", "closed": false, "open": "08:00", "close": "22:00",
  "slotDuration": 60, "capacity": 2,
  "slots": [
    { "start": "08:00", "end": "09:00", "available": 2 },
    { "start": "09:00", "end": "10:00", "available": 0 }
  ]
}
```
`closed: true` (blackout/closed weekday) returns an empty `slots` array. Errors: `VALIDATION_FAILED` (bad date), `NOT_FOUND`.

---

## §8. Bookings — tenant host

### 8.1 `GET /api/v1/bookings` — auth `S:owner|admin` | `K`
Query: `?dateFrom&dateTo` (inclusive `YYYY-MM-DD`) · `?serviceId` · `?clientId` · `?status=confirmed|pending|cancelled` · `?hotelId` (owner) · `?finished=true|false` · `?paid=true|false` · `?page&limit&sort` (sortable: `date`, `createdAt`, `totalPrice`; default `date,startTime`). Paginated.

Visibility (carried over from today, now documented as contract): owner sees all company bookings; an admin sees their hotel's bookings plus bookings on services shared with their hotel — but bookings that other hotels made on the shared service come back **masked**: identifying fields blanked, `"masked": true`, only slot geometry (`serviceId,date,startTime,endTime,bufferedEndTime,duration,status`) real.

Booking shape:
```json
{
  "id": "…", "hotelId": "…", "bookedByHotelId": "…",
  "service": { "id": "…", "name": "SPA & Pool", "color": "#6366f1" },
  "clientId": null, "customerName": "John Smith", "customerPhone": "+99890…", "roomNumber": "202",
  "date": "2026-07-15", "startTime": "14:00", "endTime": "16:00", "bufferedEndTime": "16:15",
  "duration": 120, "persons": 4,
  "totalPrice": 400000, "amountPaid": 200000, "paid": false,
  "status": "confirmed", "finished": false,
  "bookingType": "room", "category": "Lux", "variantId": "half", "variantName": "Half pool",
  "menuItems": [ { "name": "Plov", "qty": 4, "price": 45000 } ], "menuReadyTime": "15:00",
  "notes": "", "paidAt": null, "finishedAt": null,
  "createdBy": { "id": "…", "name": "Aziza" },
  "createdAt": "…", "updatedAt": "…"
}
```

### 8.2 `POST /api/v1/bookings` — auth `S:owner|admin` | `K` — supports `Idempotency-Key`
Required: `serviceId`, `customerName`, `date`, `startTime`, `endTime`. Optional: `clientId`, `customerPhone`, `roomNumber`, `persons` (≥1), `totalPrice`, `amountPaid` *or* `paid: true`, `notes`, `menuItems[]`, `menuReadyTime`, `status`, `bookingType`, `category`, `variantId`, `duration`, and `hotelId` — **ignored**; attribution is always the service's owner hotel, with `bookedByHotelId` recording who booked (shared services).

Server work, in a transaction ([[API-Design]] §3.6): service visible to caller → open on date (`SERVICE_CLOSED`) → buffered-overlap count vs `capacity` (`SLOT_FULL`) → create with `history: [created(, payment|paid)]` → `201` → *after response*: notify bot service (§15.2.1), then persist the returned Telegram message ref onto the booking. Errors: `VALIDATION_FAILED`, `NOT_FOUND` (service — also used when an admin can't see it), `SERVICE_CLOSED`, `SLOT_FULL`, `PLAN_EXPIRED`.

### 8.3 `GET /api/v1/bookings/{id}` — 8.1 shape + `history[]`: `{ action, at, by: { id, name } | null, detail }`.

### 8.4 `PUT /api/v1/bookings/{id}` — **data edits only**
Editable: `date`, `startTime`, `endTime` (re-runs the full availability check, excluding this booking; appends `rescheduled` history), `customerName`, `customerPhone`, `roomNumber`, `persons`, `notes` (`notes_updated`), `menuItems`, `menuReadyTime`, `totalPrice` (re-derives `paid`), `clientId`. **Rejected here** (`422`, `details.useEndpoint`): `status`, `paid`, `amountPaid`, `finished` — those are transitions (8.5–8.8). After commit → bot `booking-updated` (§15.2.2) so the Telegram message is edited in place.

### 8.5 `POST /api/v1/bookings/{id}/payments`
```json
{ "amount": 200000 }
```
Increments `amountPaid` (clamped to `totalPrice`); sets `paid`/`paidAt` when covered; history `payment`/`paid`. `200` → booking. Errors: `VALIDATION_FAILED` (amount ≤ 0, booking is free), `PLAN_EXPIRED`.

### 8.6 `POST /api/v1/bookings/{id}/finish` → `finished: true, finishedAt`, history `finished`.
### 8.7 `POST /api/v1/bookings/{id}/reopen` → clears finished, history `reopened`.
### 8.8 `POST /api/v1/bookings/{id}/cancel`
```json
{ "reason": "guest cancelled" }
```
`status: "cancelled"` (frees the slot — cancelled bookings don't count toward capacity), history entry, Telegram message edited to the 🚫 template. Cancelling an already-cancelled booking: `204`, no-op.

### 8.9 `DELETE /api/v1/bookings/{id}` — auth `S:owner` | `K` (owner only — admins cancel, not erase)
Hard delete + best-effort Telegram message delete. `204`.

Admin write access for 8.4–8.8 follows `bookingIdScope`: an admin may manage bookings their hotel owns **or** made (`bookedByHotelId`), never other hotels' masked bookings.

---

## §9. Clients — tenant host

One shared pool per company (not per hotel — matches current model).

### 9.1 `GET /api/v1/clients` — auth `S:owner|admin` | `K`
Query: `?search=` (name/phone/roomNumber) · `?groupId=` · `?page&limit&sort` (sortable `name`, `createdAt`). Paginated:
```json
{ "id": "…", "name": "John Smith", "phone": "+99890…", "roomNumber": "202", "floor": 2,
  "notes": "", "groupId": "…", "createdAt": "…", "updatedAt": "…" }
```

### 9.2 `POST /api/v1/clients` — required `name`; optional `phone`, `roomNumber`, `floor`, `notes`, `groupId` (must exist in company). `201`.
### 9.3 `GET /api/v1/clients/{id}` — includes `bookings: { total, last: { id, date, serviceName } }` summary.
### 9.4 `PUT /api/v1/clients/{id}` / `DELETE …` — delete nulls `clientId` on their bookings (bookings keep `customerName` snapshot). `204`.

### 9.5 Client groups
- `GET /api/v1/client-groups` — auth `S:owner|admin` | `K` — plain array `{ id, name, color, order, clientCount }`.
- `POST /api/v1/client-groups` — auth `S:owner` | `K` — `{ name, color?, order? }`; `DUPLICATE` on name within company.
- `PUT /api/v1/client-groups/{id}` / `DELETE …` — auth `S:owner` | `K` — delete moves members to `groupId: null` and drops matching client-pricing rows from services (documented side-effect).

---

## §10. Contracts — tenant host

### 10.1 `GET /api/v1/contracts` — auth `S:owner|admin` | `K`
Query: `?search=` (org/number/INN text index) · `?status=awaiting|signed|terminated` · `?hotelId=` (owner) · `?expiringWithinDays=30` · `?page&limit&sort` (sortable `finishDate`, `organizationName`, `createdAt`). Paginated:
```json
{ "id": "…", "hotelId": "…", "organizationName": "UzAuto Motors", "inn": "301234567",
  "representativeName": "B. Karimov", "phone": "+99871…", "contractNumber": "C-2026-014",
  "signDate": "2026-01-15T00:00:00Z", "finishDate": "2026-12-31T00:00:00Z",
  "status": "signed", "contractLink": "https://…", "notes": "",
  "reminderDays": [30, 7], "dismissedReminders": [],
  "createdAt": "…", "updatedAt": "…" }
```

### 10.2 `POST /api/v1/contracts` — required `organizationName` + (owner: `hotelId`; admin: forced own). `201`.
### 10.3 `PUT /api/v1/contracts/{id}` — full update; changing `finishDate` or `reminderDays` resets `dismissedReminders` (so new deadlines re-alert).
### 10.4 `POST /api/v1/contracts/{id}/reminders/dismiss` — body `{ "tier": 7 }` (`0` = the "expired" tier) — replaces the PATCH overload. `204`.
### 10.5 `DELETE /api/v1/contracts/{id}` — `204`.

---

## §11. Notifications — tenant host

### 11.1 `GET /api/v1/notifications` — auth `S:owner|admin` | `K`
Derived feed (computed from contracts approaching `finishDate`, minus dismissed tiers — no stored notification documents, matches current design):
```json
{ "notifications": [
    { "kind": "contract-expiry", "contractId": "…", "organizationName": "UzAuto Motors",
      "hotelId": "…", "daysLeft": 5, "tier": 7, "finishDate": "2026-07-17T00:00:00Z" }
  ], "count": 1 }
```
Sorted most-urgent first (negative `daysLeft` = already expired). Future notification kinds add a new `kind` value — clients must ignore unknown kinds.

---

## §12. Telegram settings — tenant host

Fixes the singleton bug ([[API-Design]] §1 problem #2): `TelegramConfig` gains a **required, unique `companyId`** — one config per company.

### 12.1 `GET /api/v1/telegram/config` — auth `S:owner` | `K`
```json
{ "connected": true, "groupChatId": -1001234567890, "groupTitle": "Safir Orders",
  "connectedBy": { "id": "…", "name": "Safir Owner" }, "connectedAt": "…",
  "topics": [ { "hotel": "FG", "service": "SPA & Pool", "name": "FG-SPA & Pool" } ] }
```
`{ "connected": false }` when not set up.

### 12.2 `POST /api/v1/telegram/connect-code` — auth `S:owner` | `K`
Replaces the in-chat email+password `/login` flow (typing owner credentials into a group chat is the weakest link in the current design — messages are deleted best-effort, but the password transits Telegram's servers in plain text). New flow: this endpoint returns a short-lived one-time code; the owner sends `/connect <code>` in the target group; the bot service validates it and binds `groupChatId` to the company. Credentials never enter Telegram.
```json
{ "code": "482913", "expiresAt": "2026-07-12T10:05:00Z", "botUsername": "reservedesk_bot" }
```

### 12.3 `DELETE /api/v1/telegram/config` — auth `S:owner` | `K` — disconnects; topics records dropped; Telegram-side topics left as-is. `204`.
### 12.4 `POST /api/v1/telegram/test` — auth `S:owner` | `K` — sends "✅ test" to the group via the bot's internal API; `200 { "delivered": true }` or `502 NOTIFY_FAILED`.

---

## §13. Health — both hosts

### 13.1 `GET /api/v1/health` — no auth (Nginx may also probe it)
```json
{ "status": "ok", "db": "ok", "bot": "ok", "version": "1.4.2", "uptime": 86400 }
```
`bot` reflects the last `/healthz` probe of the bot service; `"degraded"` (bookings work, notifications don't) still returns HTTP 200 with `status: "degraded"` — only DB-down returns 503.

---

## §14. Legacy `/api/*`

Untouched during Phases 0–3, then every legacy route returns `410 GONE` with `details.v1Path` pointing at its replacement (Phase 4), then the files are deleted. Mapping table:

| Legacy | v1 replacement |
|---|---|
| `POST /api/auth/login` (body slug) | `POST /api/v1/auth/login` (subdomain) |
| `PUT /api/rooms/reorder` | `PUT /api/v1/rooms/order` |
| `PUT /api/bookings/{id}` (status/paid/finished branches) | `POST /api/v1/bookings/{id}/{payments,finish,reopen,cancel}` |
| `PATCH /api/contracts/{id}` (dismiss) | `POST /api/v1/contracts/{id}/reminders/dismiss` |
| `POST /api/telegram/webhook` | bot service `POST /webhook/telegram` (§15.1) |
| everything else | same resource under `/api/v1`, envelope + pagination applied |

---

## §15. Bot service API

Separate process (see [[Backend-and-Telegram-Bot]]). Public surface = one webhook. Everything else is loopback-only (`127.0.0.1:3001`) behind `X-Internal-Secret`. It is the **only** holder of `TELEGRAM_BOT_TOKEN`. Uses the same error envelope; propagates `X-Request-Id` when given one.

### 15.1 `POST /webhook/telegram` — auth `T` (Telegram secret token header), public via Nginx
Receives Telegram updates. Always answers `200 OK` (Telegram retry-storms otherwise); failures are logged with the update id. Handles:
- `/connect <code>` in a group — validates the code (§12.2) against the DB, binds that group to the code's company, replies with confirmation, triggers topic sync for that company.
- `/status` in a bound group — replies with company name + topics count (owner-friendly sanity check).
- Legacy `/login` — replies with a deprecation message pointing to the new connect-code flow.
Anything else in unbound chats is ignored.

### 15.2 Internal API — auth `I`, loopback only

#### 15.2.1 `POST /internal/v1/notifications/booking-created`
Called by the app after a booking commit (fire-and-forget with one retry, never blocking the HTTP response). Body: `companyId` + the notify payload (current `BookingNotifyData` shape: `bookingId`, `hotelId`, `serviceId`+name, `customerName`, `roomNumber`, `date`, `startTime`, `endTime`, `persons`, `totalPrice`, `amountPaid`, `paid`, `status`, `notes`, `menuItems[]`, `menuReadyTime`, `createdByName`).

Bot: resolve the **company's** config → ensure the (hotel, service) forum topic → pick template (itemized order message when `menuItems` non-empty, booking summary otherwise — both templates move verbatim from `src/lib/telegram.ts`) → send. `200`:
```json
{ "ref": { "chatId": -100123…, "messageId": 4512, "messageThreadId": 88 } }
```
The app stores `ref` on the booking (`tgChatId/tgMessageId/tgThreadId`). `200 { "ref": null }` when the company has no Telegram config (not an error). `502 NOTIFY_FAILED` after retries — app logs and moves on.

#### 15.2.2 `POST /internal/v1/notifications/booking-updated`
Body: `companyId`, `ref` (stored message coordinates), same notify payload. Edits the existing message in place (payment status, cancellation template, finished mark). `204`. Unknown/deleted message → `204` (best-effort, matches current semantics).

#### 15.2.3 `POST /internal/v1/topics/sync` — body `{ "companyId": "…" }`
Creates any missing (hotel, service) topics **for that company only** (the current `syncAllTopics()` iterates all services with no tenant filter — fixed here by contract). Called after `/connect` and from §12.4. `200 { "created": 3, "existing": 12 }`.

#### 15.2.4 `DELETE /internal/v1/topics/service/{serviceId}` — body `{ "companyId": "…" }`
Drops the Telegram forum topic + topic record when a service is deleted (§7.5). `204`, best-effort.

#### 15.2.5 `POST /internal/v1/connect-codes` — body `{ "companyId": "…", "code": "482913", "expiresAt": "…" }`
The app registers the §12.2 one-time code with the bot (bot owns the binding moment since it sees the group message). `201`.

### 15.3 `GET /healthz` — no auth, loopback + Nginx probe
`{ "status": "ok", "db": "ok", "telegram": "ok", "uptime": 3600 }` — `telegram` = last `getMe` probe result (cached 60s).

---

## Coverage checklist (why this is "control everything")

| Domain | Read | Create | Update | Delete | Special |
|---|---|---|---|---|---|
| Sessions | 1.3 | 1.1 | 1.4 | 1.2 | logout-all 1.5 |
| Companies | 2.1/2.3 | 2.2 (+owner) | 2.4 | 2.6 | renew 2.5, stats 2.7 |
| API keys | 3.1 | 3.2 | — | 3.3 | |
| Hotels | 4.1/4.3 | 4.2 | 4.4 | 4.5 | |
| Staff | 5.1 | 5.2 | 5.3 | 5.4 | deactivate via 5.3 |
| Rooms | 6.1 | 6.2 | 6.3 | 6.3 | reorder 6.4 |
| Services | 7.1/7.3 | 7.2 | 7.4 | 7.5 | availability 7.6 |
| Bookings | 8.1/8.3 | 8.2 | 8.4 | 8.9 | pay/finish/reopen/cancel 8.5–8.8, history 8.3 |
| Clients | 9.1/9.3 | 9.2 | 9.4 | 9.4 | groups 9.5 |
| Contracts | 10.1 | 10.2 | 10.3 | 10.5 | dismiss 10.4 |
| Notifications | 11.1 | — | — | — | derived |
| Telegram | 12.1 | 12.2 | — | 12.3 | test 12.4 |
| Ops | 13.1, 15.3 | — | — | — | |
| Bot internal | — | 15.2.1/.2/.3/.5 | — | 15.2.4 | webhook 15.1 |
