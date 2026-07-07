---
name: i18n-translations
description: Use this skill WHENEVER you add or edit any user-facing UI in this ReserveDesk app — a new page, modal, form, button, toast, error, placeholder, aria-label, empty state, table header, or tooltip. Every fixed English string must go through the hardcoded EN/UZ/RU dictionary in lib/i18n.tsx and be rendered with t(). NEVER ship a raw English literal in JSX or in showToast(...). Triggers: "new page", "add a modal/form/button", "add a toast/error message", "translate", "i18n", "UZ/RU/EN", or any edit under app/(dashboard)/** and components/**.
---

# ReserveDesk Translations (EN / UZ / RU)

This app ships its own lightweight, **hardcoded** i18n system. English is the
source language; every fixed UI string also has Uzbek (`uz`) and Russian (`ru`)
values. There is a language switcher in the header; the default is `uz`.

**Your job: no user-facing English literal ever reaches the screen untranslated.**

## The system (lib/i18n.tsx)

- One dictionary object `T`, keyed by a stable camelCase key, each entry
  `{ en, uz, ru }`. `en` is required; `uz`/`ru` fall back to `en` if missing.
- Consume it in a **client component** (`'use client'`) with the hook:
  ```tsx
  import { useTranslation } from '@/lib/i18n'
  const { t } = useTranslation()
  // ...
  <button>{t('save')}</button>
  ```
- Interpolation uses `{token}` placeholders:
  ```tsx
  t('daysBefore', { days: 30 })     // "30 days before"
  t('didYouReceive', { amount, name })
  ```
- `DictionaryKeys` is exported for typing label maps. `LANGUAGES` lists the
  switcher options.

## Rules — follow every time

1. **Add the key first.** Open `lib/i18n.tsx`, add the entry inside the matching
   `// ──` section (or a new one) with **all three languages**. Keep keys
   camelCase and descriptive (`saveContractFailed`, not `err1`). Reuse an
   existing key if one already means the same thing (`save`, `cancel`, `delete`,
   `close`, `edit`, `phone`, `notes`, `status`, `all`, `clear`, `loading`…).
2. **Render with `t()`.** Replace the literal in JSX, and in every
   `placeholder`, `title`, `aria-label`, `alt`, and toast/error string:
   ```tsx
   showToast(t('saveClientFailed'), 'error')   // not showToast('Failed to save client', ...)
   ```
3. **Module-scope label maps can't call `t()`.** For `const META = {...}` maps
   defined outside the component (status badges, tab lists, type metadata),
   store a `labelKey: DictionaryKeys` instead of a `label: string`, and resolve
   at render with `t(meta.labelKey)`. Pattern used across the codebase — copy it.
4. **A helper/subcomponent that needs a string** should call `useTranslation()`
   itself (it's cheap) or take `t` as a prop. Don't thread raw English through.
5. **NEVER translate user/dynamic data.** Hotel names, room numbers/codes,
   category names, client/guest names, service names, prices, INN, contract
   numbers, phone numbers, emails, and brand text ("ReserveDesk") stay verbatim.
   Only fixed UI chrome is translated.
6. **Pluralization / word order:** don't concatenate translated fragments in
   English order. Use separate keys or interpolation so each language reads
   naturally (`bookingOne`/`bookingsLower`, `roomLower`/`roomsLower`).
7. **Provider scope:** `LanguageProvider` wraps only the `(dashboard)` route
   group. Pre-auth screens (`app/login`, root `app/page.tsx`) are outside it and
   cannot use `t()` — don't add the hook there unless you also extend the
   provider.

## Adding a dictionary entry

```ts
// inside T = { ... } in lib/i18n.tsx, under the relevant section
myNewLabel: { en: "Save Changes", uz: "Saqlash", ru: "Сохранить" },
```

Write natural, correct Uzbek (Latin script, e.g. "Saqlash", "Bekor qilish") and
Russian — not machine-literal calques. Match the tone of nearby entries.

## Before you say "done"

Run these and confirm they're clean (ignore `ReserveDesk` and pure
example/URL/number placeholders like `SAF78`, `https://…`, `e.g. 15`):

```bash
# typecheck
npx tsc --noEmit

# any literal JSX text left untranslated in the app UI?
grep -rnoE '>[A-Z][a-zA-Z]+( [a-zA-Z]+){0,4}<' 'app/(dashboard)' components/layout \
  | grep -vE 'svg|path|rect|circle|line|poly|</|\{t\(|\{format|ServiceIcon'

# any hardcoded attribute strings?
grep -rnoE '(placeholder|aria-label|title)="[A-Za-z][^"]*"' 'app/(dashboard)' components
```

Fix anything they surface, then re-run. Only then report completion.
