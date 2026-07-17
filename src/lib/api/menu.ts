import type { MenuCategory, MenuProduct } from '@/features/menu/types'

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
