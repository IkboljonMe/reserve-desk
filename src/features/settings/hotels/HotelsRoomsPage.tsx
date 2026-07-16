'use client'

import { useHotelsRoomsPage } from './useHotelsRoomsPage'
import { HotelsSection } from './components/HotelsSection'
import { RoomsSection } from './components/RoomsSection'
import { HotelModal } from './components/HotelModal'
import { RoomModal } from './components/RoomModal'

export default function HotelsRoomsPage() {
  const s = useHotelsRoomsPage()

  return (
    <div className="flex flex-col gap-9">
      <HotelsSection s={s} />
      <RoomsSection s={s} />
      <HotelModal s={s} />
      <RoomModal s={s} />
    </div>
  )
}
