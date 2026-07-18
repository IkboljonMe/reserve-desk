import mongoose, { Schema, Document, Types } from 'mongoose'

export const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

// A line item, snapshotted at order time (name + price frozen so later menu
// edits don't rewrite history). Embedded — orders are self-contained.
export interface IMenuOrderItem {
  productId: Types.ObjectId
  name: string
  price: number      // integer UZS, unit price at order time
  quantity: number
}

// A room-service order placed by a guest from the in-room menu.
export interface IMenuOrder extends Document {
  _id: Types.ObjectId
  companyId: Types.ObjectId
  hotelId: Types.ObjectId
  roomNumber: string
  guestName: string
  note: string
  status: OrderStatus
  items: IMenuOrderItem[]
  subtotal: number    // integer UZS
  serviceFee: number  // integer UZS, snapshot of the hotel's fee at order time
  total: number       // subtotal + serviceFee
  // Coordinates of the Telegram message announcing this order, so status
  // changes edit that message in place instead of posting a duplicate.
  tgChatId?: number
  tgMessageId?: number
  tgThreadId?: number
  createdAt: Date
  updatedAt: Date
}

const MenuOrderItemSchema = new Schema<IMenuOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'MenuProduct', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
)

const MenuOrderSchema = new Schema<IMenuOrder>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    roomNumber: { type: String, required: true, trim: true },
    guestName: { type: String, default: '' },
    note: { type: String, default: '' },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    items: { type: [MenuOrderItemSchema], default: [] },
    subtotal: { type: Number, default: 0, min: 0 },
    serviceFee: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    tgChatId: { type: Number },
    tgMessageId: { type: Number },
    tgThreadId: { type: Number },
  },
  { timestamps: true },
)

MenuOrderSchema.index({ hotelId: 1, status: 1, createdAt: -1 })

delete mongoose.models.MenuOrder
export const MenuOrder = mongoose.model<IMenuOrder>('MenuOrder', MenuOrderSchema)
