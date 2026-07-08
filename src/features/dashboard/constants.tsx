import { Users, BedDouble, SlidersHorizontal } from 'lucide-react'
import type { DictionaryKeys } from '@/i18n'

export const TYPE_META: Record<string, { labelKey: DictionaryKeys; icon: React.ReactNode; color: string }> = {
  client: { labelKey: 'typeClient', icon: <Users size={12} />, color: '#3b82f6' },
  room: { labelKey: 'typeRoom', icon: <BedDouble size={12} />, color: '#10b981' },
  custom: { labelKey: 'typeCustom', icon: <SlidersHorizontal size={12} />, color: '#f59e0b' },
}
