import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Admin } from '@/models/Admin'
import { TelegramConfig } from '@/models/TelegramConfig'
import { TelegramTopic } from '@/models/TelegramTopic'
import { MenuTelegramTopic } from '@/models/MenuTelegramTopic'
import { TelegramSession } from '@/models/TelegramSession'
import { deleteMessage, sendMessage, syncAllTopics } from '@/lib/telegram'
import { companyHasFeature } from '@/lib/planAccess'
import {
  buildOrdersMessage,
  buildActiveOrdersMessage,
  buildIncomeMessage,
} from '@/lib/telegramReports'

interface TelegramUpdate {
  message?: {
    message_id: number
    message_thread_id?: number
    text?: string
    chat: { id: number; type: string }
    from?: { id: number }
  }
}

const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

// Receives Telegram updates for the notifications group. Always answers 200
// so Telegram doesn't retry-storm us; failures are logged, not surfaced.
export async function POST(req: NextRequest) {
  if (WEBHOOK_SECRET) {
    const header = req.headers.get('x-telegram-bot-api-secret-token')
    if (header !== WEBHOOK_SECRET) {
      return new Response('Forbidden', { status: 403 })
    }
  }

  try {
    const update = (await req.json()) as TelegramUpdate
    const message = update.message
    const text = message?.text?.trim()
    const chatId = message?.chat.id
    const userId = message?.from?.id
    if (!message || !text || chatId === undefined || userId === undefined) {
      return new Response('OK')
    }
    if (message.chat.type !== 'group' && message.chat.type !== 'supergroup') {
      return new Response('OK')
    }

    await connectDB()

    if (text === '/login' || text.startsWith('/login@')) {
      await TelegramSession.findOneAndUpdate(
        { chatId, userId },
        { chatId, userId, step: 'awaiting_email', updatedAt: new Date() },
        { upsert: true }
      )
      await sendMessage(chatId, 'Пожалуйста, отправьте email владельца.', message.message_thread_id)
      return new Response('OK')
    }

    // Report commands: readable by anyone in a connected group. The command may
    // carry a @botname suffix in groups (e.g. "/income@MyBot"), so match the
    // leading token only.
    const cmd = text.split(/[\s@]/)[0]
    if (cmd === '/orders' || cmd === '/active-orders' || cmd === '/income') {
      const config = await TelegramConfig.findOne({ groupChatId: chatId }).lean()
      if (!config) {
        await sendMessage(chatId, 'Эта группа ещё не подключена. Отправьте /login, чтобы подключить.', message.message_thread_id)
        return new Response('OK')
      }
      const build =
        cmd === '/orders'
          ? buildOrdersMessage
          : cmd === '/active-orders'
            ? buildActiveOrdersMessage
            : buildIncomeMessage
      try {
        const reply = await build(config.companyId)
        await sendMessage(chatId, reply, message.message_thread_id)
      } catch (err) {
        console.error(`Failed to build ${cmd} report`, err)
        await sendMessage(chatId, 'Не удалось получить данные. Попробуйте позже.', message.message_thread_id)
      }
      return new Response('OK')
    }

    const session = await TelegramSession.findOne({ chatId, userId })
    if (!session) return new Response('OK')

    if (session.step === 'awaiting_email') {
      session.email = text
      session.step = 'awaiting_password'
      session.updatedAt = new Date()
      await session.save()
      await deleteMessage(chatId, message.message_id)
      await sendMessage(chatId, 'Теперь отправьте пароль.', message.message_thread_id)
      return new Response('OK')
    }

    if (session.step === 'awaiting_password') {
      const email = session.email!
      await deleteMessage(chatId, message.message_id)
      await TelegramSession.deleteOne({ _id: session._id })

      const admin = await Admin.findOne({ email: email.toLowerCase().trim(), role: 'owner' })
      const valid = admin && (await admin.comparePassword(text))
      if (!valid || !admin.companyId) {
        await sendMessage(chatId, 'Неверные данные владельца. Отправьте /login, чтобы попробовать снова.', message.message_thread_id)
        return new Response('OK')
      }

      // Telegram notifications are a plan feature — only companies whose plan
      // includes it may connect a group.
      if (!(await companyHasFeature(admin.companyId, 'telegram'))) {
        await sendMessage(chatId, 'Уведомления в Telegram недоступны на вашем тарифе. Обновите тариф, чтобы подключить группу.', message.message_thread_id)
        return new Response('OK')
      }

      // Moving to a different group invalidates this company's old topics —
      // their messageThreadIds belong to the old chat. Same-group re-login
      // (e.g. after /login was interrupted) leaves existing topics intact.
      const existing = await TelegramConfig.findOne({ companyId: admin.companyId })
      if (existing && existing.groupChatId !== chatId) {
        await TelegramTopic.deleteMany({ companyId: admin.companyId })
        await MenuTelegramTopic.deleteMany({ companyId: admin.companyId })
      }

      await TelegramConfig.findOneAndUpdate(
        { companyId: admin.companyId },
        { companyId: admin.companyId, groupChatId: chatId, loggedInBy: admin._id },
        { upsert: true }
      )
      await sendMessage(chatId, `Вход выполнен как ${admin.name}. Настраиваю темы услуг...`, message.message_thread_id)
      await syncAllTopics(admin.companyId)
      await sendMessage(chatId, 'Готово — темы настроены, уведомления о бронированиях будут приходить сюда.', message.message_thread_id)
      return new Response('OK')
    }

    return new Response('OK')
  } catch (err) {
    console.error('Telegram webhook error', err)
    return new Response('OK')
  }
}
