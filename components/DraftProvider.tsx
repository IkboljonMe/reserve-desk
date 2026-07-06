'use client'

import { createContext, useContext, useCallback } from 'react'

// How long an unsaved draft is kept before it's considered stale.
const DEFAULT_TTL_MS = 60 * 60 * 1000 // 1 hour
const STORAGE_PREFIX = 'draft:'

interface StoredDraft<T> {
  savedAt: number
  data: T
}

interface DraftContextValue {
  getDraft: <T>(key: string) => T | null
  saveDraft: <T>(key: string, data: T) => void
  clearDraft: (key: string) => void
}

const DraftContext = createContext<DraftContextValue | null>(null)

/**
 * Persists in-progress form data (drafts) to localStorage with a TTL, so a
 * user who accidentally closes a modal doesn't lose what they typed. Backed by
 * localStorage rather than React state so drafts survive a full page reload.
 */
export function DraftProvider({
  children,
  ttlMs = DEFAULT_TTL_MS,
}: {
  children: React.ReactNode
  ttlMs?: number
}) {
  const getDraft = useCallback(
    <T,>(key: string): T | null => {
      if (typeof window === 'undefined') return null
      try {
        const raw = window.localStorage.getItem(STORAGE_PREFIX + key)
        if (!raw) return null
        const parsed = JSON.parse(raw) as StoredDraft<T>
        if (Date.now() - parsed.savedAt > ttlMs) {
          window.localStorage.removeItem(STORAGE_PREFIX + key)
          return null
        }
        return parsed.data
      } catch {
        return null
      }
    },
    [ttlMs],
  )

  const saveDraft = useCallback(<T,>(key: string, data: T) => {
    if (typeof window === 'undefined') return
    try {
      const payload: StoredDraft<T> = { savedAt: Date.now(), data }
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(payload))
    } catch {
      // storage full or unavailable — drafting is best-effort, so ignore
    }
  }, [])

  const clearDraft = useCallback((key: string) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(STORAGE_PREFIX + key)
    } catch {
      // ignore
    }
  }, [])

  return (
    <DraftContext.Provider value={{ getDraft, saveDraft, clearDraft }}>
      {children}
    </DraftContext.Provider>
  )
}

export function useDraft() {
  const ctx = useContext(DraftContext)
  if (!ctx) throw new Error('useDraft must be used within a DraftProvider')
  return ctx
}
