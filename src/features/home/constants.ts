import type { CSSProperties } from 'react'
import {
  CalendarDays, LayoutDashboard, Building2, Users, FileText,
  Languages, ShieldCheck, TrendingUp, Clock4, Percent, Sparkles, Send,
} from 'lucide-react'

// Server-side translator shape (from `getT`) — threaded to the section components.
export type Translate = (key: string, params?: Record<string, string | number>) => string

export const ACCENT = '#4f6ef7'
export const ACCENT_DARK = '#3b5bdb'
export const INK = '#0f172a'
export const MUTED = '#64748b'

// Zen Dots — geometric display face for the brand wordmark and big stat numbers.
export const DISPLAY_FONT = 'var(--font-zen-dots), system-ui, sans-serif'

export const cardStyle: CSSProperties = {
  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
  boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.04)',
}
export const sectionTitle: CSSProperties = {
  fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em',
  textAlign: 'center', color: INK, marginBottom: 10,
}
export const sectionSub: CSSProperties = {
  textAlign: 'center', color: MUTED, maxWidth: 620, margin: '0 auto 2.5rem', fontSize: '1rem', lineHeight: 1.6,
}

// UNO-style palette — one vivid colour per stat card.
export const STATS = [
  { icon: TrendingUp, value: '+25%', key: 'lpStatRevenue', color: '#16a34a' },
  { icon: Clock4, value: '3h', key: 'lpStatHours', color: '#2563eb' },
  { icon: Percent, value: '95%', key: 'lpStatOccupancy', color: '#dc2626' },
  { icon: Sparkles, value: '24/7', key: 'lpStatAlways', color: '#d97706' },
] as const

export const PILLARS = [
  { icon: LayoutDashboard, title: 'lpPillar1Title', desc: 'lpPillar1Desc', points: ['lpPillar1P1', 'lpPillar1P2', 'lpPillar1P3'] },
  { icon: CalendarDays, title: 'lpPillar2Title', desc: 'lpPillar2Desc', points: ['lpPillar2P1', 'lpPillar2P2', 'lpPillar2P3'] },
  { icon: Building2, title: 'lpPillar3Title', desc: 'lpPillar3Desc', points: ['lpPillar3P1', 'lpPillar3P2', 'lpPillar3P3'] },
] as const

export const MODULES = [
  { icon: LayoutDashboard, key: 'lpModDashboard' },
  { icon: CalendarDays, key: 'lpModCalendar' },
  { icon: Building2, key: 'lpModHotels' },
  { icon: Users, key: 'lpModClients' },
  { icon: FileText, key: 'lpModContracts' },
  { icon: Send, key: 'lpModTelegram' },
  { icon: Languages, key: 'lpModLanguages' },
  { icon: ShieldCheck, key: 'lpModRoles' },
] as const

export const REVIEWS = [
  { name: 'Dilshod Rahimov', hotelKey: 'lpReview1Hotel', quoteKey: 'lpReview1Quote', initial: 'D' },
  { name: 'Nilufar Karimova', hotelKey: 'lpReview2Hotel', quoteKey: 'lpReview2Quote', initial: 'N' },
  { name: 'Sherzod Tashkentov', hotelKey: 'lpReview3Hotel', quoteKey: 'lpReview3Quote', initial: 'S' },
] as const

export const PLANS = [
  { key: 'standard', price: '100 000', highlight: false, features: ['lpPlanF1', 'lpPlanF2', 'lpPlanF3'] },
  { key: 'pro', price: '200 000', highlight: true, features: ['lpPlanF1', 'lpPlanF2', 'lpPlanF3', 'lpPlanF4', 'lpPlanF5'] },
  { key: 'vip', price: '300 000', highlight: false, features: ['lpPlanF1', 'lpPlanF2', 'lpPlanF3', 'lpPlanF4', 'lpPlanF5', 'lpPlanF6'] },
] as const

export const FAQS = [
  { q: 'lpFaq1Q', a: 'lpFaq1A' },
  { q: 'lpFaq2Q', a: 'lpFaq2A' },
  { q: 'lpFaq3Q', a: 'lpFaq3A' },
  { q: 'lpFaq4Q', a: 'lpFaq4A' },
] as const
