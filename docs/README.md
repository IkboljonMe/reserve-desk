# ReserveDesk — Project Documentation

ReserveDesk (branded **Easy Service**) is a hotel service‑reservation admin panel.
Staff (an owner across all hotels, or a hotel‑scoped admin) manage **services**
(spa, pool, conference hall, transport…), take **bookings** for them, track
payments, and get a Telegram feed per service.

## Contents

| Doc | What it covers |
| --- | --- |
| [architecture.md](./architecture.md) | Next.js setup, `src/` layout, locale routing, providers, folder conventions |
| [data-models.md](./data-models.md) | Mongo/Mongoose models and how they relate |
| [auth-and-roles.md](./auth-and-roles.md) | Sessions, the proxy (middleware), owner vs admin, API auth helpers |
| [booking-and-availability.md](./booking-and-availability.md) | The booking wizard, time‑slot generation and the overlap/buffer rules |
| [pricing.md](./pricing.md) | How a booking's price is derived (rate × hours, whole day, custom) |
| [i18n.md](./i18n.md) | EN/UZ/RU dictionaries, locale routing, adding strings |
| [telegram.md](./telegram.md) | Per‑service topics, posting and editing booking messages |
| [dashboard-and-calendar.md](./dashboard-and-calendar.md) | Analytics, the calendar, filters |

## Stack at a glance

- **Next.js 16** (App Router, Turbopack) — note: this is a *customized* Next; the
  middleware file convention is `proxy.ts`, not `middleware.ts`.
- **MongoDB** via Mongoose.
- **TypeScript**, React 19.
- Auth via signed session cookies (`jose`), no external auth provider.
- A lightweight, hand‑rolled **i18n** (EN source, UZ default, RU) — no library.
- **Telegram Bot API** for a per‑service booking feed.

## Repo layout (top level)

```
src/                     all application code   (@/* → src/*)
  app/                   Next App Router
    [locale]/            all pages, prefixed /en /uz /ru
    api/                 route handlers (NOT locale-prefixed)
  features/<name>/       one folder per screen: a useXxxPage hook + components/
  components/            shared components; components/ui = design system
  i18n/                  dictionaries + provider + config
  lib/                   db, session, telegram, helpers
  models/                Mongoose schemas
  hooks/                 shared React-Query hooks
  proxy.ts               middleware: locale prefix + auth
public/                  static assets (served past the proxy)
docs/                    ← you are here
```

## Running locally

```bash
npm run dev         # dev server (Turbopack)
npm run build       # production build (also type-checks)
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```

Requires a `.env` with `MONGODB_URI` and `SESSION_SECRET` (and, for the Telegram
feed, `TELEGRAM_BOT_TOKEN`). Seed data lives in `src/scripts/` (run with `tsx`).
