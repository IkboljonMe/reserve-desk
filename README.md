<p align="center">
  <img src="public/assets/bronit-logo.png" alt="Bronit" width="112" height="112" />
</p>

<h1 align="center">Bronit</h1>

<p align="center">
  <strong>Hotel service booking, simplified.</strong><br />
  One dashboard for every bookable hotel service — spa slots, conference halls,
  pools and more — with payments, deposits, staff roles, and instant Telegram alerts.
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" />
  <img alt="React" src="https://img.shields.io/badge/React-19-149eca?logo=react" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript" />
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Mongoose-47a248?logo=mongodb" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss" />
</p>

---

## The problem

Hotels in Uzbekistan still run their bookable services — spa treatments,
conference halls, swimming pools, banquet rooms — on paper journals, Excel
sheets, and lost phone messages. The result is familiar: double-booked slots,
untracked deposits, revenue nobody can total until month-end, and a front desk
that has no idea what was promised when the manager is away.

## What Bronit does

Bronit replaces those scattered tools with a single reservation platform.
Add a service, take bookings on a capacity-aware calendar, collect payments and
deposits, and let the whole team stay in sync through instant Telegram alerts —
across several hotels under one account, in three languages.

### Key capabilities

| | Module | What it gives you |
|---|---|---|
| 📊 | **Owner dashboard** | Cross-hotel income, occupancy, and outstanding balances — live, not at month-end |
| 📅 | **Smart calendar** | Buffer-aware, capacity-aware slots so the same room is never double-booked |
| 🏨 | **Hotels & rooms** | Run several hotels under one account; room types, floors, ordering |
| 👥 | **Clients & groups** | Guest history, VIP groups, and corporate client records |
| 📄 | **Contracts** | Corporate contracts and agreements tied to clients |
| ✈️ | **Telegram alerts** | New bookings and changes pushed to your team in seconds |
| 🌐 | **3 languages** | Full Uzbek / Russian / English UI |
| 🛡️ | **Staff roles** | Per-hotel logins and permissions — admins see only their hotel, owners see everything |

Deposits, partial payments, reschedules, and one-click **Excel export** are
included in every plan.

## Who uses it

- **Owners** — see every hotel, service, and payment from one dashboard.
- **Hotel admins** — manage bookings and clients for their own hotel only.
- **Superadmins** — platform operators who manage companies and onboarding.

---

## Tech stack

- **[Next.js 16](https://nextjs.org)** (App Router) + **React 19** + **TypeScript**
- **[Tailwind CSS 4](https://tailwindcss.com)** for styling
- **[MongoDB](https://www.mongodb.com)** via **[Mongoose](https://mongoosejs.com)**
- **[jose](https://github.com/panva/jose)** (JWT session cookies) + **bcryptjs** (password hashing)
- **[TanStack Query](https://tanstack.com/query)** for client data fetching
- **Telegram Bot API** for booking notifications
- **[SheetJS (xlsx)](https://sheetjs.com)** for Excel export, **[Swiper](https://swiperjs.com)** + **[GSAP](https://gsap.com)** for the marketing site
- Custom lightweight **i18n** (uz / ru / en) — no runtime dependency

### Architecture notes

- **`src/proxy.ts`** is the edge middleware: it resolves the locale (URL prefix →
  cookie → `Accept-Language` → Russian fallback), guards the authenticated
  `/secure/**` areas, and routes across subdomains (marketing on the root domain,
  the live demo on the `demo.` subdomain).
- **`src/features/home/`** is the public marketing landing page; the app itself
  lives under `src/app/[locale]/secure/**`.
- Locales: **Uzbek** is the primary market language (and the sitemap primary),
  while **Russian** is the neutral fallback for visitors we can't detect a
  preference for.

---

## Getting started

### Prerequisites

- Node.js 20+
- A MongoDB connection string

### 1. Install

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```bash
# Database
MONGODB_URI="mongodb://localhost:27017/bronit"

# Auth — a long random string used to sign session cookies
SESSION_SECRET="change-me-to-a-long-random-secret"

# Bootstrap superadmin account
SUPERADMIN_EMAIL="admin@example.com"
SUPERADMIN_PASSWORD="change-me"

# Telegram notifications (optional in development)
TELEGRAM_BOT_TOKEN=""
TELEGRAM_WEBHOOK_SECRET=""
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to a
locale-prefixed URL (e.g. `/uz`).

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check with `tsc --noEmit` |
| `npm run check` | Typecheck **and** lint (run before committing) |
| `npm run optimize:images` | Compress `public/sliders/**` images and generate WebP + JPG (idempotent) |

---

## Project structure

```
src/
├── app/[locale]/        # Routes (marketing landing + /secure dashboards)
├── features/            # Feature modules (home/landing, book, …)
├── components/          # Shared UI components
├── models/              # Mongoose schemas (Booking, Hotel, Room, Client, …)
├── lib/                 # Auth/session, db, subdomain helpers
├── i18n/                # Dictionaries (en/uz/ru) + translator
├── hooks/               # Shared React hooks
└── proxy.ts             # Edge middleware: locale, auth, subdomains
```

---

<p align="center"><sub>© Bronit — booking automation, built for Uzbekistan.</sub></p>
