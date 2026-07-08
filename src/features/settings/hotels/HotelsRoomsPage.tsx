'use client'

import { useHotelsRoomsPage } from './useHotelsRoomsPage'
import { HotelsSection } from './components/HotelsSection'
import { RoomsSection } from './components/RoomsSection'
import { HotelModal } from './components/HotelModal'
import { RoomModal } from './components/RoomModal'

export default function HotelsRoomsPage() {
  const s = useHotelsRoomsPage()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
      <HotelsSection s={s} />
      <RoomsSection s={s} />
      <HotelModal s={s} />
      <RoomModal s={s} />
    </div>
  )
}
