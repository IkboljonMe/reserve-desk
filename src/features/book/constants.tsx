import { Users, BedDouble } from 'lucide-react'
import type { DictionaryKeys } from '@/i18n'
import type { BookingType } from './types'

export const TYPE_META: Record<BookingType, { labelKey: DictionaryKeys; descKey: DictionaryKeys; color: string; icon: React.ReactNode }> = {
  client: { labelKey: 'clients', descKey: 'bookClientDesc', color: '#3b82f6', icon: <Users size={22} /> },
  room: { labelKey: 'rooms', descKey: 'bookRoomDesc', color: '#10b981', icon: <BedDouble size={22} /> },
}
