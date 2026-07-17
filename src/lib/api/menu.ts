import type { MenuCategory, MenuProduct, MenuOrder, OrderStatus } from '@/features/menu/types'

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
