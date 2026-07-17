export interface LocalizedText {
  en: string
  ru: string
  uz: string
}

export interface MenuCategory {
  _id: string
  hotelId: string
  name: string
  sourceLang: string
  nameI18n: LocalizedText
  sortOrder: number
}

export interface MenuProduct {
  _id: string
  hotelId: string
  categoryId: string
  name: string
  description: string
  sourceLang: string
  nameI18n: LocalizedText
  descI18n: LocalizedText
  price: number
  imageUrl: string
  available: boolean
  sortOrder: number
}

export interface MenuHotel {
  _id: string
  name: string
  shortName: string
  slug?: string
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

export interface MenuOrderItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export interface MenuOrder {
  _id: string
  hotelId: string
  roomNumber: string
  guestName: string
  note: string
  status: OrderStatus
  items: MenuOrderItem[]
  subtotal: number
  serviceFee: number
  total: number
  createdAt: string
}
