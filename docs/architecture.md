# Architecture

## Next.js, but customized

This runs on **Next.js 16 (App Router + Turbopack)**. Two things differ from a
stock Next app, and both are load‑bearing:

1. **Middleware is `src/proxy.ts`, not `middleware.ts`.** In this Next version the
   `middleware` convention was renamed to `proxy`. It still runs before routes
   and can redirect/rewrite. See [auth-and-roles.md](./auth-and-roles.md).
2. **All app code lives under `src/`.** The path alias `@/*` maps to `./src/*`
   (`tsconfig.json`). `public/`, config files and `.env` stay at the repo root.

> Because the framework behaves differently from stock Next, prefer the bundled
> docs in `node_modules/next/dist/docs/` over general Next knowledge when
> touching routing, middleware, or file conventions.

## Locale‑prefixed routing

Every user‑facing route is nested under a `[locale]` segment, so URLs start with
`/en`, `/uz`, or `/ru`:

```
src/app/
  [locale]/
    layout.tsx           ROOT layout: <html lang>, wraps LanguageProvider, generateStaticParams(en/uz/ru)
    page.tsx             redirects to /{locale}/dashboard
    not-found.tsx
    login/               /{locale}/login   (public)
    (dashboard)/         auth-gated group; layout requires a session
      layout.tsx         QueryProvider + ToastProvider + DraftProvider + DashboardContainer
      dashboard/ calendar/ book/ clients/ contracts/ notifications/
      settings/ (admins, services, hotels, client-groups)
  api/                   route handlers — NOT under [locale]
  globals.css  favicon.ico
```

The proxy adds the locale prefix on any locale‑less request and enforces auth.
API routes and static files (anything with a file extension) bypass it. Full
details in [i18n.md](./i18n.md) and [auth-and-roles.md](./auth-and-roles.md).

## The `features/` convention

Each screen is a folder under `src/features/<name>/`:

```
features/dashboard/
  DashboardPage.tsx        composes the pieces (the route re-exports this)
  useDashboardPage.ts      one hook: all state, effects, handlers, derived data
  components/              presentational pieces, each takes the hook's state
  constants.tsx utils.ts types.ts
```

- The route file (`src/app/[locale]/(dashboard)/dashboard/page.tsx`) is a
  **one‑line re‑export** of the feature's page component.
- The `useXxxPage()` hook returns one big object; presentational components take
  it (often as `s` or `w`) and call `useTranslation()` themselves.
- This keeps route files tiny and makes each screen a self‑contained unit.

Feature‑specific components live inside the feature (`features/*/components/`);
only genuinely shared components live in `src/components/`.

## Providers (where state lives)

- **`LanguageProvider`** — `src/app/[locale]/layout.tsx` (root). Wraps the whole
  app so both login and dashboard can translate. Language is driven by the URL
  locale segment.
- **`QueryProvider`** (React Query), **`ToastProvider`**, **`DraftProvider`** —
  the dashboard group layout only. `DraftProvider` autosaves in‑progress forms
  (e.g. the new‑service form) to `localStorage`.

## Design system

`src/components/ui/` holds the reusable primitives:

- `Button.tsx` — variants (`primary/secondary/danger/ghost`) and sizes; `md` is
  the 38px control height that matches…
- `Dropdown.tsx` — the reusable select (38px trigger). Toolbars mix these two, so
  they share a height.
- `InfoHint.tsx` — an "i" icon with a hover/focus tooltip (used on form fields).
- `Select.tsx`, `Input.tsx`, `Skeleton.tsx`, `Spinner.tsx`.

Icons are **lucide-react** everywhere in the UI (no emoji "stickers"). Emoji are
only used in Telegram messages and CLI scripts.

## Data fetching

- Some screens use **React Query** hooks in `src/hooks/` (`useServices`,
  `useHotels`, `useBookings`, `useContracts`, `useNotifications`).
- Others fetch directly in their `useXxxPage` hook (`fetch('/api/…')`).
- API clients for a few resources live in `src/lib/api/`.

## Server code

- `src/lib/mongodb.ts` — cached Mongoose connection (`connectDB()`), safe to call
  per request.
- `src/lib/session.ts` — session encode/decode + auth guards (see auth doc).
- `src/lib/telegram.ts` — all Telegram Bot API calls.
- Route handlers under `src/app/api/**/route.ts` (Node runtime, use Mongoose).
