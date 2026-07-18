# Menu (room-service) integration

Porting the `hotel-menu` project (in-room QR ordering) into Bronit as a new
**Menu** module for hotels. Guests scan a room QR → browse a translated menu →
order → staff get a Telegram notification in a dedicated forum topic → manage
orders from the dashboard.

Source project: `D:\work\tv-samples\hotel-menu` (Next 14, React 18, Tailwind 3,
**Prisma → MongoDB**, AI translation, QR/PDF, SSE order stream).

## Strategy

Reuse Bronit's data store, tenancy, auth, Telegram, i18n and UI. Rewrite the
source's Prisma models as **Mongoose** models (same MongoDB store, different
ORM). Menu data hangs off Bronit's existing `Hotel._id`.

## Decisions

- ✅ **Database:** MongoDB via **Mongoose** (rewrite Prisma models; no second ORM).
- ✅ **Existing data:** **migrate** from the hotel-menu MongoDB (both are Mongo — a one-off script maps each hotel-menu `hotelId` → the matching Bronit `Hotel._id` and copies records + `nameI18n`). Formalized in Phase 7.
- ✅ **Translation:** **manual** en/ru/uz entry now; add **Google Translate API** auto-translate later (not Anthropic).
- ✅ **Guest page delivery:** `https://fergana.bronit.uz/en/menu?hotel=safirhotel&room=101` — **subdomain = company** (`fergana` → `Company.slug`, already globally unique), `?hotel=` = hotel (`Hotel.slug`, unique within the company), `?room=` = room, `/en` = locale. No new subdomain field needed — reuse existing company/hotel slugs. (Phase 3 will teach the proxy to route company-slug subdomains to the guest menu.)
- ✅ **Telegram:** reuse Bronit's `telegram.ts`; menu orders get a **new forum topic** per hotel.
- ✅ **Auth/tenancy:** drop `hotel-menu`'s own passwords; use Bronit sessions + roles (owner/admin/superadmin), Company → Hotel.

## Entity mapping (source → Bronit)

| hotel-menu (Prisma) | Bronit (Mongoose) | Notes |
|---|---|---|
| `Hotel` | reuse `Hotel` (+ menu settings) | serviceFee, preorderEnabled, guest branding → on `Hotel` or `HotelMenuSettings` |
| `Room` | reuse `Room` | menu orders reference `roomId` |
| `Category` | `MenuCategory` | `nameI18n` {en,ru,uz}, sortOrder |
| `Product` | `MenuProduct` | price (int UZS), `nameI18n`/`descI18n`, imageUrl, available |
| `Recommendation` | `MenuRecommendation` | featured product per weekday |
| `Order` | `MenuOrder` | status, serviceFee snapshot, total |
| `OrderItem` | `MenuOrderItem` | name/price snapshot, qty |
| `ServiceRequest` | `GuestServiceRequest` | taxi/reception/alarm from the in-room page |
| `HotelService` | `GuestService` | manager-defined in-room services (transfer, pool…) |

**Naming convention:** menu models are prefixed (`Menu*` / `Guest*`) to avoid
confusion with Bronit's existing `Service` (bookable services), `Room`, `Booking`.

## Module layout

- `src/models/Menu*.ts`, `GuestService.ts`, `GuestServiceRequest.ts` — Mongoose models
- `src/features/menu/` — dashboard management UI (categories, products, orders)
- `src/features/menu/guest/` (or `src/app/[locale]/hotel/[hotelHostname]/…`) — public guest menu
- Telegram: extend `src/lib/telegram.ts` with a menu-orders topic helper

## Phases

- [x] **Phase 0 — Scope & scaffolding.** This doc + module scaffold; naming/conventions fixed; baseline green.
- [x] **Phase 1 — Data model.** Mongoose models: `MenuCategory`, `MenuProduct`, `MenuRecommendation`, `GuestService`, `HotelMenuSettings` (incl. globally-unique guest `subdomain`) + shared `LocalizedText`. Verified with `scripts/menu-models-check.ts` (DB-free) and `tsc`.
- [x] **Phase 2 — Menu management (dashboard).** "Menu" nav item (owner/admin) + `/menu` routes; session-scoped API (`/api/menu/categories`, `/api/menu/products` + `[id]`); CRUD categories & products with en/ru/uz (`LocalizedInput`) + price + image + availability, reusing the `Modal`. Owner hotel picker. i18n in en/ru/uz. `tsc` + eslint clean. _Not yet run against a live DB._
- [x] **Phase 3 — Guest menu (read-only).** Proxy routes company-slug subdomains → public `/[locale]/menu` (preserving `?hotel=&room=`); server-rendered guest page resolves company (Host) → hotel (`?hotel`) → menu, with EN/RU/UZ switch and `localized()` fallback. `tsc` + eslint clean. _Not yet run against a live DB/subdomain._
- [x] **Phase 4 — Ordering + orders dashboard.**
  - [x] **4a** — `MenuOrder` (embedded items, snapshotted name/price, service fee); public guest ordering API (`/api/menu/guest/order`, resolves company from Host, computes totals server-side); staff orders API (`/api/menu/orders` GET + `[id]` PATCH); "Orders" nav + `/orders` dashboard with status flow (pending→preparing→ready→delivered, cancel) and 15s polling. i18n in en/ru/uz. `tsc` + eslint clean.
  - [x] **4b** — guest cart UI: `GuestMenuClient` (add-to-cart stepper, cart drawer, place order) wired into the guest route in place of the old read-only page; cart persists to `localStorage` scoped per hotel+room; a new public `GET /api/menu/guest/order/[id]` lets the guest poll their placed order and see a live pending→preparing→ready→delivered step tracker (or a cancelled notice), reusing the dashboard's `ORDER_STATUS_META`. Page now also gates on `HotelMenuSettings.menuEnabled` and applies the service fee. i18n in en/ru/uz. `tsc` + eslint clean.
- [x] **Phase 5 — Telegram for orders.** `MenuTelegramTopic` (one "Menu orders" forum topic per hotel, separate from bookings' per-(hotel, service) topics since an order isn't tied to a Service). `ensureTopicForMenuOrders`/`notifyNewMenuOrder`/`notifyMenuOrderUpdated` in `src/lib/telegram.ts`. Guest order POST posts a new message and stores `tgChatId`/`tgMessageId`/`tgThreadId` on the `MenuOrder`; staff PATCH edits that message in place on every status change (pending→preparing→ready→delivered, cancel) — never a duplicate. Both fire post-response via `after()`, best-effort. `tsc` + eslint clean.
- [~] **Phase 6 — Extras.** (Each independent.)
  - [x] **Room QR + PDF** — "Print QR codes" on the dashboard Menu page opens `RoomQrModal`: a live preview grid (`qrcode.react`) of every room's QR, each encoding `https://<company-slug>.<baseDomain>/<locale>/menu?hotel=<hotel-slug>&room=<number>` (company slug read from the dashboard's own `/secure/company/<slug>/...` path, base domain from `window.location.host` same as the existing app/admin/super link-building pattern), plus a "Download PDF" button (`qrcode` + `jspdf`, 4 codes/page on A4). Disabled with a hint if the hotel has no URL slug yet. `tsc` + eslint clean.
  - [ ] Recommendations of the day
  - [ ] Guest service requests (taxi/reception/alarm)
  - [ ] Currency FX (approx. USD under each UZS price)
  - [ ] AI auto-translate (admin enters one language, others filled via Claude API)
  - [ ] SSE stream (replace polling on the guest tracker / staff orders dashboard)
- [ ] **Phase 7 — Cleanup / migration.** Consolidate i18n, tests, docs; optional Prisma→Mongoose data migration.

## Dependencies (added per phase, not upfront)

- Phase 6: `qrcode`, `qrcode.react`, `jspdf` (QR/PDF); optional `@anthropic-ai/sdk` (AI translate), `framer-motion` (guest animations).
- Validation: reuse Bronit's existing approach unless `zod` is later adopted.
