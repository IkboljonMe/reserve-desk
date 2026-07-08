'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

type Lang = 'en' | 'uz' | 'ru'

// This page renders outside the dashboard's LanguageProvider, so it reads the
// locale from the URL segment and carries its own small copy table.
const COPY: Record<Lang, { title: string; subtitle: string; back: string }> = {
  en: {
    title: 'Page not found',
    subtitle: "The page you're looking for doesn't exist or has been moved.",
    back: 'Back to Dashboard',
  },
  uz: {
    title: 'Sahifa topilmadi',
    subtitle: "Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan.",
    back: 'Boshqaruv paneliga qaytish',
  },
  ru: {
    title: 'Страница не найдена',
    subtitle: 'Страница, которую вы ищете, не существует или была перемещена.',
    back: 'Вернуться на панель',
  },
}

export default function NotFound() {
  const params = useParams()
  const raw = typeof params.locale === 'string' ? params.locale : 'uz'
  const lang: Lang = (['en', 'uz', 'ru'] as const).includes(raw as Lang) ? (raw as Lang) : 'uz'

  const t = COPY[lang]

  return (
    <main style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'var(--surface-bg, #f8fafc)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 460,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <div style={{
          fontSize: 'clamp(4.5rem, 18vw, 7rem)',
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '-0.04em',
          background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
        }}>
          404
        </div>

        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--gray-800, #1f2937)', margin: 0 }}>
          {t.title}
        </h1>

        <p style={{ fontSize: '0.95rem', color: 'var(--gray-500, #6b7280)', margin: 0, lineHeight: 1.5 }}>
          {t.subtitle}
        </p>

        <Link href={`/${lang}/dashboard`} className="btn btn-primary btn-lg" style={{ marginTop: '0.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          {t.back}
        </Link>
      </div>
    </main>
  )
}
