'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sun, Moon } from 'lucide-react'
import { guestFoodPath, rootDomain, MENU_LANGS, MENU_LANG_LABELS } from '@/lib/menu'
import { useGuestPrefs } from './useGuestPrefs'
import type { TileId, HubLang, ResolvedTile } from '@/lib/tiles'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GuestHubProps {
  hotelName: string
  hotelSlug: string
  logoUrl: string
  bannerUrl: string
  room: string
  locale: string
  tiles: ResolvedTile[]
  wifiName: string
  wifiPassword: string
  instagramUrl: string
  telegramUrl: string
  receptionPhone: string
  reviewUrl: string
}

// ─── Inline translations ───────────────────────────────────────────────────────
// Only uz/ru/en have real hub-chrome copy; the 10-language picker exists mainly
// to carry the guest's choice into the food menu (which has real 10-language
// content). Any other pick falls back to English here — see asHubLang().

const L: Record<HubLang, Record<string, string>> = {
  uz: {
    room: 'Xona',
    wifiNetwork: 'Tarmoq nomi',
    wifiPassword: 'Parol',
    copy: 'Nusxa olish',
    copied: '✓ Nusxa olindi',
    contactReception: 'Qabulxonaga murojaat qiling',
    contactReceptionDesc: 'Yordam uchun qabulxona xodimlarimizga murojaat qiling yoki quyidagi raqamga qo\'ng\'iroq qiling.',
    reportProblem: 'Muammo haqida xabar berish',
    problemPlaceholder: "Muammoni qisqacha tasvirlab bering...",
    send: 'Yuborish',
    sending: 'Yuborilmoqda...',
    sent: '✓ Yuborildi!',
    close: 'Yopish',
    call: 'Qo\'ng\'iroq qilish',
    followUs: 'Bizni ijtimoiy tarmoqlarda kuzatib boring',
    isYourProperty: 'Sizning muassasangiz bormi?',
    joinFree: "Bronit'ga bepul ulaning",
  },
  ru: {
    room: 'Номер',
    wifiNetwork: 'Название сети',
    wifiPassword: 'Пароль',
    copy: 'Копировать',
    copied: '✓ Скопировано',
    contactReception: 'Обратитесь на ресепшн',
    contactReceptionDesc: 'Пожалуйста, обратитесь к сотрудникам нашей рецепции или позвоните по номеру ниже.',
    reportProblem: 'Сообщить о проблеме',
    problemPlaceholder: 'Кратко опишите проблему...',
    send: 'Отправить',
    sending: 'Отправка...',
    sent: '✓ Отправлено!',
    close: 'Закрыть',
    call: 'Позвонить',
    followUs: 'Следите за нами в социальных сетях',
    isYourProperty: 'Ваш объект?',
    joinFree: 'Подключитесь к Bronit бесплатно',
  },
  en: {
    room: 'Room',
    wifiNetwork: 'Network',
    wifiPassword: 'Password',
    copy: 'Copy',
    copied: '✓ Copied',
    contactReception: 'Contact Reception',
    contactReceptionDesc: 'Please contact our front desk staff for assistance or call the number below.',
    reportProblem: 'Report a Problem',
    problemPlaceholder: 'Briefly describe your issue...',
    send: 'Send',
    sending: 'Sending...',
    sent: '✓ Sent!',
    close: 'Close',
    call: 'Call',
    followUs: 'Follow us on social media',
    isYourProperty: 'Is this your property?',
    joinFree: 'Join Bronit for free',
  },
}

// The 10-language picker's selection collapsed down to a supported hub-chrome
// language (uz/ru/en) — anything else falls back to English.
function asHubLang(lang: string): HubLang {
  return lang === 'uz' || lang === 'ru' ? lang : 'en'
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text, label, copied: copiedLabel }: { text: string; label: string; copied: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => { /* silently ignore */ })
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`text-[0.75rem] px-2.5 py-1 rounded-md border-none cursor-pointer transition-colors ${
        copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[var(--gray-100)] text-[var(--gray-600)]'
      }`}
    >
      {copied ? copiedLabel : label}
    </button>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function HubModal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/72 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[448px] bg-[var(--surface-card)] rounded-t-[20px] px-6 pt-7 pb-9 [animation:hubSlideUp_0.25s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
      <style>{`@keyframes hubSlideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  )
}

const MODAL_CLOSE_BTN = 'w-full p-3 rounded-xl border-none bg-[var(--gray-100)] text-[var(--gray-600)] text-[0.9rem] font-semibold cursor-pointer'

// ─── Main component ────────────────────────────────────────────────────────────

export function GuestHubClient({
  hotelName, hotelSlug, logoUrl, bannerUrl, room,
  locale, tiles, wifiName, wifiPassword,
  instagramUrl, telegramUrl, receptionPhone, reviewUrl,
}: GuestHubProps) {
  const router = useRouter()

  const { lang, setLang, theme, toggleTheme, themeVars } = useGuestPrefs(locale)
  const hubLang = asHubLang(lang)
  const [modal, setModal] = useState<TileId | null>(null)
  const [problem, setProblem] = useState('')
  const [problemStatus, setProblemStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  // Marketing homepage link — relative during SSR, upgraded to the absolute
  // root-domain URL after mount (this page is served from menu./demo.
  // subdomains, so a plain `/<locale>` link would stay on the wrong host).
  const [joinHref, setJoinHref] = useState(`/${locale}`)

  useEffect(() => {
    setJoinHref(`${window.location.protocol}//${rootDomain(window.location.host)}/${locale}`)
  }, [locale])

  const t = (key: string) => L[hubLang][key] || L.en[key] || key
  const closeModal = useCallback(() => { setModal(null); setProblem(''); setProblemStatus('idle') }, [])

  const enabledTiles = tiles.filter(t => t.enabled)

  // Path-based food page on the menu subdomain (same-origin nav). The URL's own
  // locale segment stays fixed (chrome text is server-rendered per-request) —
  // the guest's 10-language content pick travels via useGuestPrefs, not the URL.
  const menuFoodHref = guestFoodPath(locale, hotelSlug, room)

  const handleTileClick = (id: TileId) => {
    if (id === 'menu') {
      router.push(menuFoodHref)
      return
    }
    if (id === 'reviews' && reviewUrl) {
      window.open(reviewUrl, '_blank', 'noopener,noreferrer')
      return
    }
    setModal(id)
  }

  const handleProblemSubmit = async () => {
    if (!problem.trim()) return
    setProblemStatus('sending')
    try {
      await fetch('/api/menu/guest/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel: hotelSlug, room, message: problem }),
      })
    } catch { /* best-effort */ }
    setProblemStatus('sent')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-[var(--surface-bg)] text-[var(--gray-800)]" style={{ fontFamily: "'Inter',system-ui,sans-serif", ...themeVars }}>
    <div className="max-w-[448px] mx-auto">
      {/* ── Banner ─────────────────────────────────────────────── */}
      <div className="relative h-[220px] overflow-hidden shrink-0">
        {bannerUrl
          ? <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-[linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)]" />
        }
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.3)_0%,rgba(12,12,14,0.85)_100%)]" />

        {/* Top controls */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-start justify-between gap-2">
          {/* Room badge */}
          {room ? (
            <div className="bg-black/60 backdrop-blur-md border border-white/18 rounded-full py-1.5 px-3.5 text-[0.85rem] font-bold text-white flex items-center gap-1.5">
              <span className="text-white/50 font-normal">{t('room')}:</span>
              <span className="text-white">{room}</span>
            </div>
          ) : <span />}

          {/* Language + theme */}
          <div className="flex items-center gap-1.5">
            <select
              value={lang}
              onChange={e => setLang(e.target.value as typeof lang)}
              aria-label="Language"
              className="bg-black/45 backdrop-blur-md border border-white/10 rounded-[10px] py-1.5 px-2 text-[0.72rem] font-bold text-white cursor-pointer outline-none"
            >
              {MENU_LANGS.map(l => (
                <option key={l} value={l} className="text-black">{MENU_LANG_LABELS[l]}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-8 h-8 rounded-[10px] bg-black/45 backdrop-blur-md border border-white/10 flex items-center justify-center text-white cursor-pointer shrink-0"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Hotel Identity ─────────────────────────────────────── */}
      <div className="flex items-center gap-3.5 px-5 pt-5 pb-2">
        <div className={`w-[60px] h-[60px] rounded-full shrink-0 border-[2.5px] border-[var(--gray-300)] overflow-hidden flex items-center justify-center ${logoUrl ? 'bg-white' : 'bg-[linear-gradient(135deg,#4f6ef7,#7c3aed)]'}`}>
          {logoUrl
            ? <img src={logoUrl} alt={hotelName} className="w-full h-full object-cover" />
            : <span className="text-white text-[1.4rem] font-extrabold">{hotelName.charAt(0).toUpperCase()}</span>
          }
        </div>
        <h1 className="m-0 text-[1.25rem] font-extrabold text-[var(--gray-900)] leading-tight">{hotelName}</h1>
      </div>

      {/* ── Tile Grid ──────────────────────────────────────────── */}
      <div className="p-3.5 grid grid-cols-2 gap-2.5">
        {enabledTiles.map(tile => (
          <button
            key={tile.id}
            type="button"
            onClick={() => handleTileClick(tile.id)}
            className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[18px] pt-[22px] px-3.5 pb-[18px] flex flex-col items-center gap-2.5 cursor-pointer text-center transition-transform active:scale-[0.96] [-webkit-tap-highlight-color:transparent]"
          >
            <span className="text-[2.75rem] leading-none block">{tile.emoji}</span>
            <span className="text-[0.8rem] font-semibold text-[var(--gray-700)] leading-snug">
              {tile.label[hubLang] || tile.label.uz}
            </span>
          </button>
        ))}
      </div>

      {/* ── Social links ───────────────────────────────────────── */}
      {(instagramUrl || telegramUrl) && (
        <div className="text-center px-5 pt-4 pb-2">
          <p className="mb-3 text-[0.78rem] text-[var(--gray-400)] tracking-wide">{t('followUs')}</p>
          <div className="flex justify-center gap-4">
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer"
                className="w-11 h-11 rounded-full bg-[var(--gray-100)] border border-[var(--surface-border)] flex items-center justify-center no-underline transition-colors"
              >
                {/* Instagram SVG */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ig)" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="4" stroke="url(#ig2)" strokeWidth="2"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="#e1306c"/>
                  <defs>
                    <linearGradient id="ig" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#f9ce34"/><stop offset="0.5" stopColor="#ee2a7b"/><stop offset="1" stopColor="#6228d7"/>
                    </linearGradient>
                    <linearGradient id="ig2" x1="8" y1="8" x2="16" y2="16" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#f9ce34"/><stop offset="0.5" stopColor="#ee2a7b"/><stop offset="1" stopColor="#6228d7"/>
                    </linearGradient>
                  </defs>
                </svg>
              </a>
            )}
            {telegramUrl && (
              <a href={telegramUrl} target="_blank" rel="noopener noreferrer"
                className="w-11 h-11 rounded-full bg-[var(--gray-100)] border border-[var(--surface-border)] flex items-center justify-center no-underline"
              >
                {/* Telegram SVG */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="#2AABEE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#2AABEE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Footer branding ────────────────────────────────────── */}
      <div className="text-center px-5 pt-5 pb-10">
        <p className="mb-1 text-[0.75rem] text-[var(--gray-300)]">{t('isYourProperty')}</p>
        <a
          href={joinHref}
          className="text-[0.8rem] font-bold tracking-wide no-underline text-[rgba(245,166,35,0.9)]"
        >
          {t('joinFree')}
        </a>
      </div>
    </div>

      {/* ── Modals (viewport-fixed — deliberately outside the 448px column) ── */}

      {/* Wi-Fi modal */}
      <HubModal open={modal === 'wifi'} onClose={closeModal}>
        <div className="text-center mb-5">
          <span className="text-[2.5rem]">📶</span>
          <h2 className="mt-2 mb-0 text-[1.1rem] font-bold text-[var(--gray-900)]">Wi-Fi</h2>
        </div>
        {wifiName && (
          <div className="bg-[var(--gray-50)] rounded-xl py-3 px-4 mb-2.5 flex items-center justify-between gap-2">
            <div>
              <p className="m-0 text-[0.7rem] text-[var(--gray-400)]">{t('wifiNetwork')}</p>
              <p className="m-0 text-[0.95rem] font-semibold text-[var(--gray-900)]">{wifiName}</p>
            </div>
            <CopyButton text={wifiName} label={t('copy')} copied={t('copied')} />
          </div>
        )}
        {wifiPassword && (
          <div className="bg-[var(--gray-50)] rounded-xl py-3 px-4 mb-5 flex items-center justify-between gap-2">
            <div>
              <p className="m-0 text-[0.7rem] text-[var(--gray-400)]">{t('wifiPassword')}</p>
              <p className="m-0 text-[0.95rem] font-semibold text-[var(--gray-900)]">{wifiPassword}</p>
            </div>
            <CopyButton text={wifiPassword} label={t('copy')} copied={t('copied')} />
          </div>
        )}
        <button type="button" onClick={closeModal} className={MODAL_CLOSE_BTN}>{t('close')}</button>
      </HubModal>

      {/* Problem report modal */}
      <HubModal open={modal === 'problem'} onClose={closeModal}>
        <div className="text-center mb-5">
          <span className="text-[2.5rem]">⚠️</span>
          <h2 className="mt-2 mb-0 text-[1.1rem] font-bold text-[var(--gray-900)]">{t('reportProblem')}</h2>
        </div>
        {problemStatus === 'sent'
          ? <p className="text-center text-emerald-400 font-semibold text-base mb-5">{t('sent')}</p>
          : (
            <>
              <textarea
                value={problem}
                onChange={e => setProblem(e.target.value)}
                placeholder={t('problemPlaceholder')}
                rows={4}
                className="w-full box-border rounded-xl p-3 mb-3 bg-[var(--gray-50)] border border-[var(--surface-border)] text-[var(--gray-900)] text-[0.9rem] resize-none outline-none"
              />
              <button
                type="button"
                disabled={problemStatus === 'sending' || !problem.trim()}
                onClick={handleProblemSubmit}
                className={`w-full p-3 rounded-xl border-none text-white text-[0.9rem] font-bold mb-2.5 ${problem.trim() ? 'bg-[var(--brand-500)] cursor-pointer' : 'bg-[var(--brand-500)]/35 cursor-default'}`}
              >
                {problemStatus === 'sending' ? t('sending') : t('send')}
              </button>
            </>
          )
        }
        <button type="button" onClick={closeModal} className={MODAL_CLOSE_BTN}>{t('close')}</button>
      </HubModal>

      {/* Reception / contact modal (alarm, taxi, services, reception) */}
      <HubModal open={modal === 'alarm' || modal === 'taxi' || modal === 'services' || modal === 'reception' || modal === 'reviews'} onClose={closeModal}>
        <div className="text-center mb-5">
          {modal && (
            <span className="text-[2.5rem]">
              {tiles.find(t => t.id === modal)?.emoji || '🛎️'}
            </span>
          )}
          <h2 className="mt-2 mb-0 text-[1.1rem] font-bold text-[var(--gray-900)]">
            {modal ? (tiles.find(t => t.id === modal)?.label[hubLang] || '') : ''}
          </h2>
        </div>
        <p className="text-center text-[var(--gray-500)] text-[0.9rem] mb-5 leading-relaxed">{t('contactReceptionDesc')}</p>
        {receptionPhone && (
          <a
            href={`tel:${receptionPhone}`}
            className="block text-center py-3.5 rounded-xl bg-[rgba(79,110,247,0.2)] border border-[rgba(79,110,247,0.4)] text-[#8ea2ff] no-underline font-bold text-base mb-2.5"
          >
            📞 {receptionPhone}
          </a>
        )}
        <button type="button" onClick={closeModal} className={MODAL_CLOSE_BTN}>{t('close')}</button>
      </HubModal>
    </div>
  )
}
