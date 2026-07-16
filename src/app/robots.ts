import type { MetadataRoute } from 'next'

const BASE_URL = 'https://bronit.uz'

// Complements sitemap.ts: keeps crawlers out of the authenticated
// owner/admin/superadmin dashboards, API routes, the demo auto-login
// endpoint, and the unfinished /hotel/[hotelHostname] stub. The marketing
// pages and the universal /login screen stay crawlable.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: ['/api/', '/*/secure/', '/*/demo', '/*/hotel/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
