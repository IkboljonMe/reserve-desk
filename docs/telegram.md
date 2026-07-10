# Telegram integration

A Telegram **forum group** mirrors bookings: each `(hotel, service)` gets its own
**topic**, and every booking is posted there in Russian. All Bot API calls are in
`src/lib/telegram.ts`. Everything is **best‑effort** — a Telegram failure never
blocks a booking or a web request. If `TELEGRAM_BOT_TOKEN` is unset, all of it
no‑ops.

## Setup / topics

- `TelegramConfig` stores the connected `groupChatId` (set via the bot's webhook
  conversation, `src/app/api/telegram/webhook/route.ts`).
- `ensureTopicForService(hotelId, serviceId)` returns (creating if needed) the
  forum topic `messageThreadId` for that pair, named `${hotel.shortName}-${service.name}`.
  Stored in `TelegramTopic`.
- `syncAllTopics()` pre‑creates topics for every service (called after login).
- `deleteTopicForService()` removes a topic when its service is deleted.

## Posting a new booking

On `POST /api/bookings`, after the record is created, `notifyNewBooking(...)`
posts to the service's topic and **returns the message coordinates**
(`{ chatId, messageThreadId, messageId }`), which are saved back onto the booking
(`tgChatId/tgMessageId/tgThreadId`). This is what lets a later update **edit** the
same message instead of posting a duplicate.

Message shape (Russian, emoji intentional):

```
🆕 <b>{service name}</b>
🕒 {date} {start}-{end}
👤 {customer} (номер {room})
👥 {persons} чел.                (only when persons > 1)
🧑‍💼 Забронировал: {admin name}
💰 {price} UZS — Оплачено ✅ | Не оплачено ❌
✅ Завершено                     (when finished)
```

Cancelled bookings render with a `🚫 <b>Отменено</b>` header. Built by
`buildBookingMessage()`.

## Editing on update / lifecycle

`notifyBookingUpdated(...)` rebuilds the text and calls `editMessageText` so the
message stays in sync **in place** (never a duplicate). Triggered by:

- `PUT /api/bookings/[id]` when **paid**, **finished**, or **status** changes.
- `DELETE /api/bookings/[id]` — the message is edited to the cancelled header
  before the record is removed.

All runs via `after()` (post‑response), best‑effort.

## Helpers

`sendMessage`, `editMessageText`, `deleteMessage`, `createForumTopic`,
`deleteForumTopic` — thin wrappers over `callTelegram(method, payload)` which
guards on `TELEGRAM_BOT_TOKEN`.

## Gaps (backlog)

- Reschedule (time/service change) isn't wired to a message edit yet.
