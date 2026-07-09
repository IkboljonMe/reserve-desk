import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Admin } from '@/models/Admin'
import { TelegramConfig } from '@/models/TelegramConfig'
import { TelegramSession } from '@/models/TelegramSession'
import { deleteMessage, sendMessage, syncAllTopics } from '@/lib/telegram'

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
      await sendMessage(chatId, 'Please reply with the owner email.', message.message_thread_id)
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
      await sendMessage(chatId, 'Now reply with the password.', message.message_thread_id)
      return new Response('OK')
    }

    if (session.step === 'awaiting_password') {
      const email = session.email!
      await deleteMessage(chatId, message.message_id)
      await TelegramSession.deleteOne({ _id: session._id })

      const admin = await Admin.findOne({ email: email.toLowerCase().trim(), role: 'owner' })
      const valid = admin && (await admin.comparePassword(text))
      if (!valid) {
        await sendMessage(chatId, 'Invalid owner credentials. Send /login to try again.', message.message_thread_id)
        return new Response('OK')
      }

      await TelegramConfig.deleteMany({})
      await TelegramConfig.create({ groupChatId: chatId, loggedInBy: admin._id })
      await sendMessage(chatId, `Logged in as ${admin.name}. Setting up service topics...`, message.message_thread_id)
      await syncAllTopics()
      await sendMessage(chatId, 'Done — topics are ready and booking notifications will post here.', message.message_thread_id)
      return new Response('OK')
    }

    return new Response('OK')
  } catch (err) {
    console.error('Telegram webhook error', err)
    return new Response('OK')
  }
}
