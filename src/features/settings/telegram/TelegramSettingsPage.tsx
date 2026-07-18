'use client'

import { MessageCircle, Check, RefreshCw } from 'lucide-react'
import { useTranslation } from '@/i18n'
import Spinner from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useTelegramPage } from './useTelegramPage'
import type { TelegramTopicSummary } from '@/lib/api/telegram'

function Toggle({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5.5 w-10 shrink-0 items-center rounded-full transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-[image:var(--brand-gradient)]' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-150 ${
          checked ? 'translate-x-[22px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  )
}

function InstructionsCard({ botUsername }: { botUsername: string | null }) {
  const { t } = useTranslation()
  const botHandle = botUsername ? `@${botUsername}` : t('telegramBotFallback')
  const steps = [
    t('telegramStep1'),
    t('telegramStep2'),
    t('telegramStep3', { bot: botHandle }),
    t('telegramStep4'),
    t('telegramStep5'),
  ]
  return (
    <div className="card">
      <h3 className="text-gray-800 font-semibold mb-1">{t('telegramSetupTitle')}</h3>
      <p className="text-gray-500 text-sm mb-3">{t('telegramSetupSubtitle')}</p>
      <ol className="flex flex-col gap-2">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-gray-700">
            <span className="shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold inline-flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function TopicRow({ topic, disabled, onToggle }: {
  topic: TelegramTopicSummary
  disabled: boolean
  onToggle: (enabled: boolean) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 first:border-t-0">
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-800 text-sm">
          {topic.kind === 'menu' ? t('menuOrdersTopic') : topic.serviceName}
        </div>
        <div className="text-[0.8125rem] text-gray-500">{topic.hotelName}</div>
      </div>
      <Toggle checked={topic.notificationsEnabled} disabled={disabled} onChange={onToggle} />
    </div>
  )
}

export default function TelegramSettingsPage() {
  const { t } = useTranslation()
  const s = useTelegramPage()
  const { status, loading } = s

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner size={28} /></div>
  }

  if (!status) return null

  return (
    <div className="flex flex-col gap-5">
      <InstructionsCard botUsername={status.botUsername} />

      {!status.connected ? (
        <div className="card">
          <EmptyState icon={<MessageCircle size={24} strokeWidth={1.75} />}>
            <h3 className="text-gray-700">{t('telegramNotConnectedTitle')}</h3>
            <p>{t('telegramNotConnectedDesc')}</p>
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="success"><Check size={12} /> {t('telegramConnected')}</Badge>
                <span className="text-sm text-gray-600">
                  {t('telegramConnectedBy', { name: status.loggedInByName ?? '' })}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={s.handleSync} disabled={s.syncing} leftIcon={<RefreshCw size={13} />}>
                  {s.syncing ? t('syncing') : t('telegramSyncNow')}
                </Button>
                {s.disconnectConfirm ? (
                  <div className="flex gap-1.5 items-center">
                    <Button variant="danger" size="sm" onClick={s.handleDisconnect} disabled={s.disconnecting}>
                      {s.disconnecting ? <Spinner size={14} dark={false} /> : t('telegramConfirmDisconnect')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => s.setDisconnectConfirm(false)}>{t('cancel')}</Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => s.setDisconnectConfirm(true)}>
                    {t('telegramDisconnect')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-gray-800 font-semibold mb-1">{t('telegramTopics')}</h3>
            <p className="text-gray-500 text-sm mb-3">{t('telegramTopicsSubtitle')}</p>
            <div className="card p-0 overflow-hidden">
              {status.topics.length === 0 ? (
                <EmptyState icon={<MessageCircle size={24} strokeWidth={1.75} />}>
                  <h3 className="text-gray-700">{t('telegramNoTopicsTitle')}</h3>
                  <p>{t('telegramNoTopicsDesc')}</p>
                </EmptyState>
              ) : (
                status.topics.map(topic => (
                  <TopicRow
                    key={topic.id}
                    topic={topic}
                    disabled={s.togglingId === topic.id}
                    onToggle={enabled => s.handleToggleTopic(topic.id, topic.kind, enabled)}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
