import type { OrderStatus } from "../types";

// UI strings for the guest food-ordering flow, resolved server-side (getT) and
// passed down so the client components stay language-agnostic. Shared by
// GuestMenuClient and its extracted sub-components.
export interface GuestLabels {
  room: string;
  sum: string;
  menuEmpty: string;
  add: string;
  total: string;
  close: string;
  cancel: string;
  yourOrder: string;
  viewOrder: string;
  placeOrder: string;
  placingOrder: string;
  orderPlaced: string;
  orderPlacedDesc: string;
  emptyCart: string;
  subtotal: string;
  serviceFee: string;
  roomNumber: string;
  guestNamePlaceholder: string;
  orderNotePlaceholder: string;
  orderFailed: string;
  roomRequiredError: string;
  itemsN: string;
  cancelledTitle: string;
  cancelledSub: string;
  orderNo: string;
  couldNotLoad: string;
  backToMenu: string;
  orderSummary: string;
  notes: string;
  orderPending: string;
  orderPreparing: string;
  orderReady: string;
  orderDelivered: string;
  recommendedToday: string;
  reviewTitle: string;
  reviewCommentPlaceholder: string;
  reviewSubmit: string;
  reviewThanks: string;
}

// The subset of a placed order the guest tracker polls and renders.
export interface TrackedOrder {
  status: OrderStatus;
  items: { name: string; price: number; quantity: number }[];
  subtotal: number;
  serviceFee: number;
  total: number;
  note: string;
}
