'use client'

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/components/ToastProvider'
import { useTranslation } from '@/i18n'
import { getHotels } from '@/lib/api/hotels'
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  getProducts, createProduct, updateProduct, deleteProduct,
} from '@/lib/api/menu'
import type { MenuCategory, MenuProduct, MenuHotel } from './types'

export function useMenuPage() {
  const { t } = useTranslation()
  const { showToast } = useToast()

  const [hotels, setHotels] = useState<MenuHotel[]>([])
  const [hotelId, setHotelId] = useState('')
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [products, setProducts] = useState<MenuProduct[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [editCategory, setEditCategory] = useState<MenuCategory | null>(null)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<MenuProduct | null>(null)
  const [productCategoryId, setProductCategoryId] = useState('')
  const [productOpen, setProductOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load hotels the user can manage; pick the first by default.
  useEffect(() => {
    getHotels()
      .then((hs: MenuHotel[]) => {
        setHotels(hs)
        setHotelId(prev => prev || hs[0]?._id || '')
      })
      .catch(() => showToast(t('menuLoadFailed'), 'error'))
  }, [showToast, t])

  const loadMenu = useCallback((hid: string) => {
    if (!hid) { setCategories([]); setProducts([]); setLoading(false); return }
    setLoading(true)
    Promise.all([getCategories(hid), getProducts(hid)])
      .then(([cats, prods]) => { setCategories(cats); setProducts(prods) })
      .catch(() => showToast(t('menuLoadFailed'), 'error'))
      .finally(() => setLoading(false))
  }, [showToast, t])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data load
  useEffect(() => { loadMenu(hotelId) }, [hotelId, loadMenu])

  // ── Category actions ──
  const openAddCategory = () => { setEditCategory(null); setCategoryOpen(true) }
  const openEditCategory = (c: MenuCategory) => { setEditCategory(c); setCategoryOpen(true) }

  const saveCategory = async (data: Partial<MenuCategory>) => {
    setSaving(true)
    try {
      if (editCategory) await updateCategory(editCategory._id, data)
      else await createCategory({ ...data, hotelId } as Partial<MenuCategory> & { hotelId: string })
      setCategoryOpen(false)
      loadMenu(hotelId)
      showToast(t('saved'), 'success')
    } catch {
      showToast(t('saveFailed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const removeCategory = async (id: string) => {
    try {
      await deleteCategory(id)
      loadMenu(hotelId)
      showToast(t('deleted'), 'success')
    } catch {
      showToast(t('deleteFailed'), 'error')
    }
  }

  // ── Product actions ──
  const openAddProduct = (categoryId: string) => { setEditProduct(null); setProductCategoryId(categoryId); setProductOpen(true) }
  const openEditProduct = (p: MenuProduct) => { setEditProduct(p); setProductCategoryId(p.categoryId); setProductOpen(true) }

  const saveProduct = async (data: Partial<MenuProduct>) => {
    setSaving(true)
    try {
      if (editProduct) await updateProduct(editProduct._id, data)
      else await createProduct({ ...data, hotelId } as Partial<MenuProduct> & { hotelId: string; categoryId: string })
      setProductOpen(false)
      loadMenu(hotelId)
      showToast(t('saved'), 'success')
    } catch {
      showToast(t('saveFailed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const removeProduct = async (id: string) => {
    try {
      await deleteProduct(id)
      loadMenu(hotelId)
      showToast(t('deleted'), 'success')
    } catch {
      showToast(t('deleteFailed'), 'error')
    }
  }

  const productsByCategory = (categoryId: string) =>
    products.filter(p => p.categoryId === categoryId)

  return {
    hotels, hotelId, setHotelId,
    categories, products, productsByCategory, loading, saving,
    // category modal
    categoryOpen, setCategoryOpen, editCategory, openAddCategory, openEditCategory, saveCategory, removeCategory,
    // product modal
    productOpen, setProductOpen, editProduct, productCategoryId, openAddProduct, openEditProduct, saveProduct, removeProduct,
  }
}

export type MenuPageState = ReturnType<typeof useMenuPage>
