'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { guestFoodPath, rootDomain } from '@/lib/menu'
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

// ─── Lang storage ──────────────────────────────────────────────────────────────

const LS_KEY = 'bronit_hub_lang'
function getSavedLang(fallback: HubLang): HubLang {
  if (typeof window === 'undefined') return fallback
  const v = localStorage.getItem(LS_KEY)
  return (v === 'uz' || v === 'ru' || v === 'en') ? v : fallback
}
function saveLang(lang: HubLang) {
  try { localStorage.setItem(LS_KEY, lang) } catch { /* ignore */ }
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
      className="text-[0.75rem] px-2.5 py-1 rounded-md transition-colors"
      style={{
        background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)',
        color: copied ? '#4ade80' : 'rgba(255,255,255,0.7)',
        border: 'none',
        cursor: 'pointer',
      }}
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
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 448,
          background: '#1c1c1e',
          borderRadius: '20px 20px 0 0',
          padding: '28px 24px 36px',
          animation: 'hubSlideUp 0.25s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
      <style>{`@keyframes hubSlideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function GuestHubClient({
  hotelName, hotelSlug, logoUrl, bannerUrl, room,
  locale, tiles, wifiName, wifiPassword,
  instagramUrl, telegramUrl, receptionPhone, reviewUrl,
}: GuestHubProps) {
  const router = useRouter()
  const pathname = usePathname()

  const initLang: HubLang = (locale === 'uz' || locale === 'ru' || locale === 'en') ? locale : 'uz'
  const [lang, setLang] = useState<HubLang>(initLang)
  const [modal, setModal] = useState<TileId | null>(null)
  const [problem, setProblem] = useState('')
  const [problemStatus, setProblemStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  // Marketing homepage link — relative during SSR, upgraded to the absolute
  // root-domain URL after mount (this page is served from menu./demo.
  // subdomains, so a plain `/<locale>` link would stay on the wrong host).
  const [joinHref, setJoinHref] = useState(`/${locale}`)

  // Load persisted lang after mount
  useEffect(() => {
    setLang(getSavedLang(initLang))
  }, [initLang])

  useEffect(() => {
    setJoinHref(`${window.location.protocol}//${rootDomain(window.location.host)}/${lang}`)
  }, [lang])

  const switchLang = (l: HubLang) => { setLang(l); saveLang(l) }
  const t = (key: string) => L[lang][key] || L.uz[key] || key
  const closeModal = useCallback(() => { setModal(null); setProblem(''); setProblemStatus('idle') }, [])

  const enabledTiles = tiles.filter(t => t.enabled)

  // Path-based food page on the menu subdomain (same-origin nav).
  const menuFoodHref = guestFoodPath(lang, hotelSlug, room)

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

  const BG = '#0c0c0e'
  const CARD = '#1a1a1c'
  const BORDER = 'rgba(255,255,255,0.07)'

  return (
    <div style={{ minHeight: '100dvh', background: BG, fontFamily: "'Inter',system-ui,sans-serif", color: '#f0f0f0' }}>
    <div style={{ maxWidth: 448, margin: '0 auto' }}>
      {/* ── Banner ─────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 220, overflow: 'hidden', flexShrink: 0 }}>
        {bannerUrl
          ? <img src={bannerUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)' }} />
        }
        {/* Dark gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(12,12,14,0.85) 100%)' }} />

        {/* Top controls */}
        <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {/* Language switcher */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.45)', borderRadius: 10, padding: '3px 4px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {(['uz', 'ru', 'en'] as HubLang[]).map(l => (
              <button
                key={l}
                type="button"
                onClick={() => switchLang(l)}
                style={{
                  padding: '4px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
                  transition: 'all 0.15s',
                  background: lang === l ? 'rgba(255,255,255,0.95)' : 'transparent',
                  color: lang === l ? '#0c0c0e' : 'rgba(255,255,255,0.65)',
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Room badge */}
          {room && (
            <div style={{
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 20, padding: '5px 14px',
              fontSize: '0.85rem', fontWeight: 700, color: '#fff',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>{t('room')}:</span>
              <span style={{ color: '#fff' }}>{room}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Hotel Identity ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 20px 8px' }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
          border: '2.5px solid rgba(255,255,255,0.25)',
          overflow: 'hidden',
          background: logoUrl ? '#fff' : 'linear-gradient(135deg,#4f6ef7,#7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {logoUrl
            ? <img src={logoUrl} alt={hotelName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800 }}>{hotelName.charAt(0).toUpperCase()}</span>
          }
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{hotelName}</h1>
        </div>
      </div>

      {/* ── Tile Grid ──────────────────────────────────────────── */}
      <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {enabledTiles.map(tile => (
          <button
            key={tile.id}
            type="button"
            onClick={() => handleTileClick(tile.id)}
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 18,
              padding: '22px 14px 18px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              cursor: 'pointer',
              transition: 'transform 0.12s, background 0.12s',
              WebkitTapHighlightColor: 'transparent',
              textAlign: 'center',
            }}
            onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)' }}
            onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
            onTouchStart={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)' }}
            onTouchEnd={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
          >
            <span style={{ fontSize: '2.75rem', lineHeight: 1, display: 'block' }}>{tile.emoji}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.88)', lineHeight: 1.35 }}>
              {tile.label[lang] || tile.label.uz}
            </span>
          </button>
        ))}
      </div>

      {/* ── Social links ───────────────────────────────────────── */}
      {(instagramUrl || telegramUrl) && (
        <div style={{ textAlign: 'center', padding: '16px 20px 8px' }}>
          <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.02em' }}>{t('followUs')}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer"
                style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'background 0.15s' }}
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
                style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
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
      <div style={{ textAlign: 'center', padding: '20px 20px 40px' }}>
        <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.28)' }}>{t('isYourProperty')}</p>
        <a
          href={joinHref}
          style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'rgba(245,166,35,0.9)', letterSpacing: '0.01em', textDecoration: 'none' }}
        >
          {t('joinFree')}
        </a>
      </div>
    </div>

      {/* ── Modals (viewport-fixed — deliberately outside the 448px column) ── */}

      {/* Wi-Fi modal */}
      <HubModal open={modal === 'wifi'} onClose={closeModal}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: '2.5rem' }}>📶</span>
          <h2 style={{ margin: '8px 0 0', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Wi-Fi</h2>
        </div>
        {wifiName && (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{t('wifiNetwork')}</p>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{wifiName}</p>
            </div>
            <CopyButton text={wifiName} label={t('copy')} copied={t('copied')} />
          </div>
        )}
        {wifiPassword && (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{t('wifiPassword')}</p>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{wifiPassword}</p>
            </div>
            <CopyButton text={wifiPassword} label={t('copy')} copied={t('copied')} />
          </div>
        )}
        <button type="button" onClick={closeModal} style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>{t('close')}</button>
      </HubModal>

      {/* Problem report modal */}
      <HubModal open={modal === 'problem'} onClose={closeModal}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: '2.5rem' }}>⚠️</span>
          <h2 style={{ margin: '8px 0 0', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{t('reportProblem')}</h2>
        </div>
        {problemStatus === 'sent'
          ? <p style={{ textAlign: 'center', color: '#4ade80', fontWeight: 600, fontSize: '1rem', margin: '0 0 20px' }}>{t('sent')}</p>
          : (
            <>
              <textarea
                value={problem}
                onChange={e => setProblem(e.target.value)}
                placeholder={t('problemPlaceholder')}
                rows={4}
                style={{ width: '100%', borderRadius: 12, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.9rem', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
              />
              <button
                type="button"
                disabled={problemStatus === 'sending' || !problem.trim()}
                onClick={handleProblemSubmit}
                style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: problem.trim() ? '#4f6ef7' : 'rgba(79,110,247,0.35)', color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: problem.trim() ? 'pointer' : 'default', marginBottom: 10 }}
              >
                {problemStatus === 'sending' ? t('sending') : t('send')}
              </button>
            </>
          )
        }
        <button type="button" onClick={closeModal} style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>{t('close')}</button>
      </HubModal>

      {/* Reception / contact modal (alarm, taxi, services, reception) */}
      <HubModal open={modal === 'alarm' || modal === 'taxi' || modal === 'services' || modal === 'reception' || modal === 'reviews'} onClose={closeModal}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {modal && (
            <span style={{ fontSize: '2.5rem' }}>
              {tiles.find(t => t.id === modal)?.emoji || '🛎️'}
            </span>
          )}
          <h2 style={{ margin: '8px 0 0', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
            {modal ? (tiles.find(t => t.id === modal)?.label[lang] || '') : ''}
          </h2>
        </div>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', margin: '0 0 20px', lineHeight: 1.5 }}>{t('contactReceptionDesc')}</p>
        {receptionPhone && (
          <a
            href={`tel:${receptionPhone}`}
            style={{ display: 'block', textAlign: 'center', padding: '13px', borderRadius: 12, background: 'rgba(79,110,247,0.2)', border: '1px solid rgba(79,110,247,0.4)', color: '#8ea2ff', textDecoration: 'none', fontWeight: 700, fontSize: '1rem', marginBottom: 10 }}
          >
            📞 {receptionPhone}
          </a>
        )}
        <button type="button" onClick={closeModal} style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>{t('close')}</button>
      </HubModal>
    </div>
  )
}
