export interface Hotel {
  _id: string
  name: string
  shortName: string
  location: string
  roomTypes: string[]
}

export interface Room {
  _id: string
  hotelId: string
  number: string
  floor: number
  type: string
}
