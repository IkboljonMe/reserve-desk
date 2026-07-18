# Menu module

In-room room-service ordering for hotels (ported from `hotel-menu`). See the
repo-root [`MENU-INTEGRATION.md`](../../../MENU-INTEGRATION.md) for the full plan
and phase checklist.

## Conventions

- **Data lives in MongoDB via Mongoose.** Models are in `src/models/` with a
  `Menu*` / `Guest*` prefix (`MenuCategory`, `MenuProduct`, `MenuOrder`,
  `MenuOrderItem`, `MenuRecommendation`, `GuestService`, `GuestServiceRequest`)
  to avoid clashing with Bronit's existing `Service`, `Room`, `Booking`.
- **Tenancy:** every menu record references a Bronit `Hotel._id`; access is
  gated by Bronit sessions/roles (owner sees all hotels, admin sees their own).
- **Per-record i18n:** translatable menu fields store a JSON map
  `{ en, ru, uz }` (e.g. `nameI18n`, `descI18n`) with a `sourceLang` fallback —
  distinct from the app-chrome dictionaries in `src/i18n/`.
- **Money:** integer UZS (so'm), no minor units.
- **Telegram:** reuse `src/lib/telegram.ts`; menu orders post to a dedicated
  forum topic per hotel.

## Planned structure

```
src/features/menu/
├── components/        # dashboard management UI (categories, products, orders)
├── guest/             # public in-room menu (or under app/.../hotel/[hostname])
└── constants.ts       # order statuses, request types, shared enums
```

Nothing is wired yet — Phase 1 adds the Mongoose models.
