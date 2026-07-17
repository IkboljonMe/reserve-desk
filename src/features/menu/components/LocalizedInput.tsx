'use client'

import type { LocalizedText } from '../types'

const LANGS: { key: keyof LocalizedText; label: string }[] = [
  { key: 'en', label: 'EN' },
  { key: 'ru', label: 'RU' },
  { key: 'uz', label: 'UZ' },
]

export const FIELD_INPUT =
  'flex-1 min-w-0 px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[var(--gray-800)] hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]'

// A translatable text field: one row per language (EN / RU / UZ), editing a
// { en, ru, uz } value in place. Used for menu category/product names & descriptions.
export function LocalizedInput({
  label, value, onChange, textarea, placeholder,
}: {
  label: string
  value: LocalizedText
  onChange: (v: LocalizedText) => void
  textarea?: boolean
  placeholder?: string
}) {
  const set = (key: keyof LocalizedText, v: string) => onChange({ ...value, [key]: v })

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.8125rem] font-semibold text-[var(--gray-700)] tracking-tight">{label}</label>
      <div className="flex flex-col gap-2">
        {LANGS.map(({ key, label: lang }) => (
          <div key={key} className="flex items-start gap-2">
            <span className="mt-2 w-7 shrink-0 text-[0.7rem] font-bold text-[var(--gray-400)]">{lang}</span>
            {textarea ? (
              <textarea
                className={`${FIELD_INPUT} resize-y min-h-[52px]`}
                value={value[key]}
                placeholder={placeholder}
                onChange={e => set(key, e.target.value)}
              />
            ) : (
              <input
                className={FIELD_INPUT}
                value={value[key]}
                placeholder={placeholder}
                onChange={e => set(key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
