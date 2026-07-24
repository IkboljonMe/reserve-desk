import {
  CalendarDays, LayoutDashboard, Building2, Users, FileText,
  Languages, ShieldCheck, TrendingUp, Clock4, Percent, Sparkles, Send,
} from 'lucide-react'

// Server-side translator shape (from `getT`) — threaded to the section components.
export type Translate = (key: string, params?: Record<string, string | number>) => string

// Zen Dots — geometric display face for the brand wordmark and big stat numbers.
export const DISPLAY_FONT = 'var(--font-zen-dots), system-ui, sans-serif'

// Shared Tailwind class strings for the landing sections.
export const CARD = 'border border-slate-200 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)]'
export const SECTION_TITLE = 'text-center font-extrabold tracking-[-0.02em] text-slate-900 mb-2.5 text-[clamp(1.5rem,3vw,2rem)]'
export const SECTION_SUB = 'text-center text-slate-500 max-w-155 mx-auto mb-10 text-base leading-relaxed'

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

// Static landing pricing. NOTE: this is marketing copy only and is intentionally
// decoupled from the operational `Plan` model (which gates features per company
// in the dashboard). Prices are monthly, per hotel, in UZS. `taglineKey` is a
// separate line above the feature bullets ("Everything in X, plus:").
export interface LandingPlan {
  key: string
  name: string
  price: number         // 0 for the Custom / "talk to us" plan
  highlight: boolean
  // Custom plan: renders without a numeric price and routes its CTA to the
  // call-back contact form instead of the live demo.
  custom?: boolean
}

// Prices are the DISCOUNTED monthly price; the original is 10% higher (shown
// struck-through in the UI, computed as price × 1.1).
export const PRICING_PLANS: LandingPlan[] = [
  { key: 'standard', name: 'Standard', price: 300000, highlight: false },
  { key: 'pro', name: 'Pro', price: 600000, highlight: true },
  { key: 'vip', name: 'VIP', price: 800000, highlight: false },
  { key: 'custom', name: 'Custom', price: 0, highlight: false, custom: true },
]

// Comparison matrix rows: each capability and which plans include it. Tiers are
// cumulative (Pro ⊇ Standard, VIP ⊇ Pro); Custom can include anything.
// Order = increasing tier.
export interface PricingFeatureRow {
  labelKey: string
  plans: string[]
}

export const PRICING_FEATURES: PricingFeatureRow[] = [
  // Standard: booking platform + service notifications + contracts.
  { labelKey: 'lpFeatBooking', plans: ['standard', 'pro', 'vip', 'custom'] },
  { labelKey: 'lpFeatClients', plans: ['standard', 'pro', 'vip', 'custom'] },
  { labelKey: 'lpFeatServiceNotif', plans: ['standard', 'pro', 'vip', 'custom'] },
  { labelKey: 'lpFeatContracts', plans: ['standard', 'pro', 'vip', 'custom'] },
  // Pro: the QR-menu / Telegram-ordering system.
  { labelKey: 'lpFeatQrMenu', plans: ['pro', 'vip', 'custom'] },
  { labelKey: 'lpFeatTgOrders', plans: ['pro', 'vip', 'custom'] },
  // VIP: analytics, scheduled reports, priority support.
  { labelKey: 'lpFeatStats', plans: ['vip', 'custom'] },
  { labelKey: 'lpFeatReports', plans: ['vip', 'custom'] },
  { labelKey: 'lpFeatSupport247', plans: ['vip', 'custom'] },
  // Custom only.
  { labelKey: 'lpFeatCustomSetup', plans: ['custom'] },
]

export const FAQS = [
  { q: 'lpFaq1Q', a: 'lpFaq1A' },
  { q: 'lpFaq2Q', a: 'lpFaq2A' },
  { q: 'lpFaq3Q', a: 'lpFaq3A' },
  { q: 'lpFaq4Q', a: 'lpFaq4A' },
] as const
