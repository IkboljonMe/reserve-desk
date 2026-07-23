import type { MenuCategory, MenuProduct, MenuOrder, MenuRecommendation, OrderStatus, GuestServiceItem } from '@/features/menu/types'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Request failed')
  }
  return res.json() as Promise<T>
}

// ── Categories ──
export function getCategories(hotelId: string): Promise<MenuCategory[]> {
  return fetch(`/api/menu/categories?hotelId=${encodeURIComponent(hotelId)}`).then(r => json<MenuCategory[]>(r))
}

export function createCategory(data: Partial<MenuCategory> & { hotelId: string }): Promise<MenuCategory> {
  return fetch('/api/menu/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => json<MenuCategory>(r))
}

export function updateCategory(id: string, data: Partial<MenuCategory>): Promise<MenuCategory> {
  return fetch(`/api/menu/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => json<MenuCategory>(r))
}

export function deleteCategory(id: string): Promise<{ ok: true }> {
  return fetch(`/api/menu/categories/${id}`, { method: 'DELETE' }).then(r => json<{ ok: true }>(r))
}

// ── Products ──
export function getProducts(hotelId: string): Promise<MenuProduct[]> {
  return fetch(`/api/menu/products?hotelId=${encodeURIComponent(hotelId)}`).then(r => json<MenuProduct[]>(r))
}

export function createProduct(data: Partial<MenuProduct> & { hotelId: string; categoryId: string }): Promise<MenuProduct> {
  return fetch('/api/menu/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => json<MenuProduct>(r))
}

export function updateProduct(id: string, data: Partial<MenuProduct>): Promise<MenuProduct> {
  return fetch(`/api/menu/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => json<MenuProduct>(r))
}

export function deleteProduct(id: string): Promise<{ ok: true }> {
  return fetch(`/api/menu/products/${id}`, { method: 'DELETE' }).then(r => json<{ ok: true }>(r))
}

// ── Guest services (manager-defined guest-hub offerings) ──
export function getGuestServices(hotelId: string): Promise<GuestServiceItem[]> {
  return fetch(`/api/menu/guest-services?hotelId=${encodeURIComponent(hotelId)}`).then(r => json<GuestServiceItem[]>(r))
}

export function createGuestService(data: Partial<GuestServiceItem> & { hotelId: string }): Promise<GuestServiceItem> {
  return fetch('/api/menu/guest-services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => json<GuestServiceItem>(r))
}

export function updateGuestService(id: string, data: Partial<GuestServiceItem>): Promise<GuestServiceItem> {
  return fetch(`/api/menu/guest-services/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => json<GuestServiceItem>(r))
}

export function deleteGuestService(id: string): Promise<{ ok: true }> {
  return fetch(`/api/menu/guest-services/${id}`, { method: 'DELETE' }).then(r => json<{ ok: true }>(r))
}

// ── Recommendations ──
export function getRecommendations(hotelId: string): Promise<MenuRecommendation[]> {
  return fetch(`/api/menu/recommendations?hotelId=${encodeURIComponent(hotelId)}`).then(r => json<MenuRecommendation[]>(r))
}

export function createRecommendation(data: { hotelId: string; dayOfWeek: number; productId: string }): Promise<MenuRecommendation> {
  return fetch('/api/menu/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => json<MenuRecommendation>(r))
}

export function deleteRecommendation(id: string): Promise<{ ok: true }> {
  return fetch(`/api/menu/recommendations/${id}`, { method: 'DELETE' }).then(r => json<{ ok: true }>(r))
}

// ── Menu mode (shared vs per-hotel) ──
export interface MenuMode {
  mode: 'per_hotel' | 'shared'
  sourceHotelId: string | null
}

export function getMenuMode(): Promise<MenuMode> {
  return fetch('/api/menu/mode').then(r => json<MenuMode>(r))
}

export function setMenuMode(data: { mode: 'per_hotel' | 'shared'; sourceHotelId?: string | null }): Promise<MenuMode> {
  return fetch('/api/menu/mode', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => json<MenuMode>(r))
}

// ── Translate ──
export function translateText(
  text: string,
  sourceLang: string,
  skip: string[] = [],
): Promise<Record<string, string>> {
  return fetch('/api/menu/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, sourceLang, skip }),
  }).then(r => json<{ translations: Record<string, string> }>(r)).then(d => d.translations)
}

// ── Orders (staff) ──
export function getOrders(params: { hotelId?: string; status?: string } = {}): Promise<MenuOrder[]> {
  const qs = new URLSearchParams()
  if (params.hotelId) qs.set('hotelId', params.hotelId)
  if (params.status) qs.set('status', params.status)
  const suffix = qs.toString() ? `?${qs}` : ''
  return fetch(`/api/menu/orders${suffix}`).then(r => json<MenuOrder[]>(r))
}

export function updateOrderStatus(id: string, status: OrderStatus): Promise<MenuOrder> {
  return fetch(`/api/menu/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }).then(r => json<MenuOrder>(r))
}
