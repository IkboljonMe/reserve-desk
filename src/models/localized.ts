import { Schema } from 'mongoose'

// Per-record translations for menu data (product/category names, descriptions).
// Distinct from the app-chrome dictionaries in src/i18n — these travel with the
// document. Empty strings fall back to the record's `sourceLang` value (`name`).
export interface LocalizedText {
  en: string
  ru: string
  uz: string
}

// Reusable embedded sub-schema (safe to share the instance across parent
// schemas). `_id: false` — it's a value object, not its own document.
export const LocalizedSchema = new Schema<LocalizedText>(
  {
    en: { type: String, default: '' },
    ru: { type: String, default: '' },
    uz: { type: String, default: '' },
  },
  { _id: false },
)
