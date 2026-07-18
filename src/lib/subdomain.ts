// Subdomain detection — shared between server middleware and client components.
// Production: *.bronit.uz    Local: *.bronit.test

/**
 * Extract the subdomain from a hostname string (server-side).
 * Returns null for the root domain, 'www', plain localhost, or IP addresses.
 */
export function getSubdomain(hostname: string): string | null {
  // Strip port (e.g. "app.bronit.test:3000" → "app.bronit.test")
  const host = hostname.split(':')[0]

  // Plain localhost / 127.0.0.1 / bare IP → no subdomain
  if (host === 'localhost' || host === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return null
  }

  const parts = host.split('.')

  // 3+ parts: xyz.bronit.uz → "xyz",  xyz.bronit.test → "xyz"
  if (parts.length >= 3) {
    const sub = parts[0]
    return sub === 'www' ? null : sub
  }

  // 2 parts: check if it's explicitly a *.localhost domain
  if (parts.length === 2 && parts[1] === 'localhost') {
    const sub = parts[0]
    return sub === 'www' ? null : sub
  }

  // 2 parts: bronit.uz or bronit.test → root (no subdomain)
  return null
}

/**
 * Client-side subdomain detection (uses window.location).
 * Returns null during SSR or when on the root domain.
 */
export function getClientSubdomain(): string | null {
  if (typeof window === 'undefined') return null
  return getSubdomain(window.location.host)
}

// Well-known subdomains (anything else is treated as invalid and redirected to root).
export type KnownSubdomain = 'app' | 'admin' | 'super' | 'demo' | 'menu'
export function isKnownSubdomain(sub: string | null): sub is KnownSubdomain {
  return sub === 'app' || sub === 'admin' || sub === 'super' || sub === 'demo' || sub === 'menu'
}
