import type { DictionaryKeys } from '@/i18n'
import type { ContractStatus } from './components/ContractModal'

export type ExpiryFilter = 'all' | 'expiring' | 'expired' | 'active'
export type SortKey = 'finishSoon' | 'finishLate' | 'nameAsc' | 'recent'

export const STATUS_META: Record<ContractStatus, { labelKey: DictionaryKeys; color: string; bg: string }> = {
  signed: { labelKey: 'signed', color: '#0f9d58', bg: 'rgba(16,185,129,0.14)' },
  awaiting: { labelKey: 'awaitingSignature', color: '#b7791f', bg: 'rgba(245,158,11,0.15)' },
  terminated: { labelKey: 'terminated', color: '#6b7584', bg: 'rgba(107,117,132,0.14)' },
}
