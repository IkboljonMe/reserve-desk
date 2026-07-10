# Auth & roles

## Sessions

Login is email + password against the `Admin` collection (`POST /api/auth/login`).
On success a **signed session cookie** (`session`) is set, encrypted with `jose`
using `SESSION_SECRET`. There is no external auth provider.

`src/lib/session.ts`:

- `encrypt/decrypt` — JWT‑style encode/decode of the session payload
  (`{ userId, email, name, role, hotelId, expiresAt }`).
- `getSession()` — reads and decrypts the cookie (server components / routes).
- `requireAuth()` — returns the session or `redirect('/login')` (used by the
  dashboard layout).
- `requireDashboard()` — for API routes; returns the session or a `Response`
  (401) the handler should return immediately.
- Scoping helpers, e.g. `bookingIdScope(session, id)` — builds a Mongo filter so
  an admin can only touch their own hotel's records (owner is unrestricted).

## Roles

- **owner** — `role === 'owner'`, `hotelId` is null. Sees every hotel and the
  Settings area.
- **admin** — scoped to a single `hotelId`. Can use every operational screen
  (calendar, book, clients, contracts) but is **kept out of Settings**.

Ownership vs. who‑booked: a booking's `hotelId` is the service's owner hotel
(revenue is attributed there); `bookedByHotelId` records which hotel actually
made it. For shared services these differ.

## The proxy (middleware)

`src/proxy.ts` runs before routes. Its `matcher` excludes `api`, `_next/*` and
`favicon.ico`; a `PUBLIC_FILE` guard also lets any request with a file extension
(e.g. `/assets/logo.png`) pass straight through, so **static assets are never
locale‑redirected**.

Flow for a matched request:

1. **Locale** — if the first path segment isn't a supported locale, redirect to
   `/{locale}{path}`, choosing the locale from the `appLang` cookie →
   `Accept-Language` → default `uz`.
2. **Auth** — strip the locale to a logical path, then:
   - no session and not a public route (`/login`) → redirect to `/{locale}/login`.
   - session on `/{locale}` or `/{locale}/login` → redirect to the landing page
     (owner → `dashboard`, admin → `calendar`).
   - admin hitting `/{locale}/settings/*` → redirect to `/{locale}/calendar`.

The dashboard layout (`requireAuth`) is a second line of defense; in practice the
proxy has already redirected unauthenticated users.

## API authorization pattern

Route handlers start with:

```ts
const session = await requireDashboard()
if (session instanceof Response) return session
```

then use scope helpers (or `session.role`/`session.hotelId`) to filter queries.
The bookings list, for instance, returns the owner everything but masks other
hotels' bookings on a shared service for an admin.

## Logout

`POST /api/auth/logout` clears the cookie. The header/sidebar then navigate to
`/{locale}/login`.
