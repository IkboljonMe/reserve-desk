'use client'

import { useEffect, useState } from 'react'
import { getClientSubdomain } from '@/lib/subdomain'
import { useTranslation } from '@/i18n'

// Ephemeral demo mode. On the `demo.` subdomain the visitor browses the real
// (read-only) demo tenant's data, but ANY change they make must never persist.
// We patch window.fetch so every mutating /api call is short-circuited with a
// synthetic success and never leaves the browser — nothing is written to Mongo,
// so the demo resets on refresh and can't be polluted.
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function isDemoHost(): boolean {
  return getClientSubdomain() === 'demo'
}

// Build a plausible success body so optimistic UIs don't choke: echo the
// submitted payload and stamp a throwaway id.
function fakeBody(rawBody: BodyInit | null | undefined): unknown {
  const id = `demo-${Math.random().toString(36).slice(2, 10)}`
  if (typeof rawBody === 'string') {
    try {
      const parsed = JSON.parse(rawBody)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return { ...parsed, _id: id, id, ok: true, success: true }
      }
    } catch {
      /* not JSON — fall through */
    }
  }
  return { _id: id, id, ok: true, success: true }
}

export function DemoGuard() {
  const { t } = useTranslation()
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!isDemoHost()) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- host is only knowable client-side (window)
    setActive(true)

    const original = window.fetch
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase()
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url

      // Only intercept our own mutating API calls; let reads, auth (logout), and
      // everything else (Next RSC/navigation) pass straight through.
      const isApi = url.includes('/api/') && !url.includes('/api/auth/')
      if (MUTATING.has(method) && isApi) {
        const body = init?.body ?? (input instanceof Request ? null : null)
        return new Response(JSON.stringify(fakeBody(body)), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return original(input, init)
    }

    return () => { window.fetch = original }
  }, [])

  if (!active) return null

  return (
    <div className="px-4 py-2 bg-amber-100 border-b border-amber-300 text-amber-900 text-[0.8rem] font-semibold text-center">
      {t('demoModeBanner')}
    </div>
  )
}
