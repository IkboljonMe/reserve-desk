export interface Room {
  _id: string
  hotelId: string
  number: string
  floor: number
}

export interface Hotel {
  _id: string
  name?: string
  shortName: string
}

export interface ClientGroup {
  _id: string
  name: string
  color: string
  hotelId?: string
}

export interface Client {
  _id: string
  hotelId: string
  name: string
  phone: string
  roomNumber: string
  floor: number
  notes: string
  groupId: ClientGroup | string | null
}

export const EMPTY_FORM = { name: '', phone: '', roomNumber: '', floor: 1, notes: '', groupId: '', hotelId: '' }
export type ClientForm = typeof EMPTY_FORM

// groupId comes back populated (object) on GET but is a raw id/string elsewhere.
export function extractGroupId(groupId: Client['groupId']): string {
  if (!groupId) return ''
  if (typeof groupId === 'string') return groupId
  return groupId._id ?? ''
}
