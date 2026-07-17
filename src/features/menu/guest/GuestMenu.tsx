import { localized } from '@/lib/menu'
import { money } from '@/lib/bookingHelpers'
import type { MenuCategory, MenuProduct } from '../types'

type Translate = (key: string, params?: Record<string, string | number>) => string

const LOCALES = ['uz', 'ru', 'en'] as const

// Read-only, mobile-first guest menu rendered on the company subdomain. Server
// component: text is resolved server-side via `t` (chrome) and `localized`
// (menu data), so no client JS is needed to browse.
export function GuestMenu({
  t, locale, hotelName, hotelSlug, room, categories, products,
}: {
  t: Translate
  locale: string
  hotelName: string
  hotelSlug: string
  room: string
  categories: MenuCategory[]
  products: MenuProduct[]
}) {
  const query = `hotel=${encodeURIComponent(hotelSlug)}${room ? `&room=${encodeURIComponent(room)}` : ''}`
  const byCategory = (id: string) => products.filter(p => p.categoryId === id)

  return (
    <div className="min-h-dvh bg-[var(--surface-bg)] text-[var(--gray-900)]">
      <header className="sticky top-0 z-10 bg-[var(--surface-card)] border-b border-[var(--surface-border)] px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[1.05rem] font-extrabold truncate m-0">{hotelName}</h1>
          {room && <p className="text-[0.8rem] text-[var(--gray-500)] m-0 mt-0.5">{t('room')} {room}</p>}
        </div>
        <nav className="flex items-center gap-1 shrink-0">
          {LOCALES.map(l => (
            <a
              key={l}
              href={`/${l}/menu?${query}`}
              className={`px-2 py-1 rounded-md text-[0.75rem] font-bold uppercase transition-colors ${
                l === locale ? 'bg-[var(--brand-500)] text-white' : 'text-[var(--gray-500)] hover:bg-[var(--gray-100)]'
              }`}
            >
              {l}
            </a>
          ))}
        </nav>
      </header>

      <main className="max-w-[680px] mx-auto px-4 py-5 flex flex-col gap-6">
        {categories.every(c => byCategory(c._id).length === 0) ? (
          <p className="text-center text-[var(--gray-400)] text-sm py-16">{t('menuEmpty')}</p>
        ) : (
          categories.map(cat => {
            const prods = byCategory(cat._id)
            if (prods.length === 0) return null
            return (
              <section key={cat._id}>
                <h2 className="text-[1.1rem] font-bold mb-3 text-[var(--gray-800)]">{localized(cat.nameI18n, cat.name, locale)}</h2>
                <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
                  {prods.map(p => {
                    const name = localized(p.nameI18n, p.name, locale)
                    const desc = localized(p.descI18n, p.description, locale)
                    return (
                      <li key={p._id} className="flex gap-3 bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-xl p-3 shadow-sm">
                        {p.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element -- arbitrary hotel-supplied URLs
                          <img src={p.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[0.95rem] text-[var(--gray-800)]">{name}</div>
                          {desc && <p className="text-[0.8rem] text-[var(--gray-500)] mt-0.5 leading-snug">{desc}</p>}
                        </div>
                        <div className="font-extrabold text-[0.95rem] text-[var(--brand-600)] whitespace-nowrap tabular-nums shrink-0">
                          {money(p.price)} {t('sum')}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })
        )}
      </main>

      <footer className="text-center text-[0.72rem] text-[var(--gray-400)] py-6">Bronit</footer>
    </div>
  )
}
