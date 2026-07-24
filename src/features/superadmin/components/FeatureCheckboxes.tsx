'use client'

import { Check } from 'lucide-react'
import { FEATURE_KEYS, FEATURE_LABELS, type FeatureKey } from '@/lib/planFeatures'

// Feature multi-select used by both the Plan and Company modals. Superadmin is
// an internal tool, so labels come from FEATURE_LABELS (English) directly rather
// than the i18n dictionary.
export function FeatureCheckboxes({
  value,
  onToggle,
  label,
}: {
  value: FeatureKey[]
  onToggle: (key: FeatureKey) => void
  label?: string
}) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div className="flex flex-col gap-1.5">
        {FEATURE_KEYS.map((key) => {
          const checked = value.includes(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              aria-pressed={checked}
              className={`flex items-center gap-2.5 px-3 py-2 text-left text-[0.85rem] border transition-colors ${
                checked
                  ? 'border-brand-500 bg-brand-50 text-gray-900 font-medium'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-4 h-4 shrink-0 border ${
                  checked ? 'bg-brand-500 border-brand-500 text-white' : 'border-gray-300 bg-white'
                }`}
              >
                {checked && <Check size={11} strokeWidth={3} />}
              </span>
              {FEATURE_LABELS[key]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
