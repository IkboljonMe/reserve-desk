export interface Hotel {
  _id: string
  name: string
  shortName: string
  // URL segment of this hotel's admin area: /secure/company/{c}/admin/{slug}
  slug?: string
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
