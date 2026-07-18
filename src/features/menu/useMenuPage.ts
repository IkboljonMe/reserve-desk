'use client'

import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
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
  const qc = useQueryClient()

  const [pickedHotelId, setHotelId] = useState('')

  // Modal state
  const [editCategory, setEditCategory] = useState<MenuCategory | null>(null)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<MenuProduct | null>(null)
  const [productCategoryId, setProductCategoryId] = useState('')
  const [productOpen, setProductOpen] = useState(false)

  const hotelsQuery = useQuery<MenuHotel[]>({ queryKey: ['hotels'], queryFn: getHotels })
  const hotels = hotelsQuery.data ?? []
  // Sticky default: the first hotel, until the user picks one explicitly.
  const hotelId = pickedHotelId || hotels[0]?._id || ''

  const categoriesQuery = useQuery<MenuCategory[]>({
    queryKey: ['menu', 'categories', hotelId],
    queryFn: () => getCategories(hotelId),
    enabled: !!hotelId,
  })
  const productsQuery = useQuery<MenuProduct[]>({
    queryKey: ['menu', 'products', hotelId],
    queryFn: () => getProducts(hotelId),
    enabled: !!hotelId,
  })
  const categories = categoriesQuery.data ?? []
  const products = productsQuery.data ?? []
  const loading = hotelsQuery.isLoading || categoriesQuery.isLoading || productsQuery.isLoading

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['menu', 'categories', hotelId] })
    qc.invalidateQueries({ queryKey: ['menu', 'products', hotelId] })
  }

  // ── Category mutations ──
  const createCategoryMut = useMutation({ mutationFn: createCategory })
  const updateCategoryMut = useMutation({ mutationFn: (vars: { id: string; data: Partial<MenuCategory> }) => updateCategory(vars.id, vars.data) })
  const deleteCategoryMut = useMutation({ mutationFn: deleteCategory })

  const openAddCategory = () => { setEditCategory(null); setCategoryOpen(true) }
  const openEditCategory = (c: MenuCategory) => { setEditCategory(c); setCategoryOpen(true) }

  const saveCategory = async (data: Partial<MenuCategory>) => {
    try {
      if (editCategory) await updateCategoryMut.mutateAsync({ id: editCategory._id, data })
      else await createCategoryMut.mutateAsync({ ...data, hotelId } as Partial<MenuCategory> & { hotelId: string })
      setCategoryOpen(false)
      invalidate()
      showToast(t('saved'), 'success')
    } catch {
      showToast(t('saveFailed'), 'error')
    }
  }

  const removeCategory = async (id: string) => {
    try {
      await deleteCategoryMut.mutateAsync(id)
      invalidate()
      showToast(t('deleted'), 'success')
    } catch {
      showToast(t('deleteFailed'), 'error')
    }
  }

  // ── Product mutations ──
  const createProductMut = useMutation({ mutationFn: createProduct })
  const updateProductMut = useMutation({ mutationFn: (vars: { id: string; data: Partial<MenuProduct> }) => updateProduct(vars.id, vars.data) })
  const deleteProductMut = useMutation({ mutationFn: deleteProduct })

  const openAddProduct = (categoryId: string) => { setEditProduct(null); setProductCategoryId(categoryId); setProductOpen(true) }
  const openEditProduct = (p: MenuProduct) => { setEditProduct(p); setProductCategoryId(p.categoryId); setProductOpen(true) }

  const saveProduct = async (data: Partial<MenuProduct>) => {
    try {
      if (editProduct) await updateProductMut.mutateAsync({ id: editProduct._id, data })
      else await createProductMut.mutateAsync({ ...data, hotelId } as Partial<MenuProduct> & { hotelId: string; categoryId: string })
      setProductOpen(false)
      invalidate()
      showToast(t('saved'), 'success')
    } catch {
      showToast(t('saveFailed'), 'error')
    }
  }

  const removeProduct = async (id: string) => {
    try {
      await deleteProductMut.mutateAsync(id)
      invalidate()
      showToast(t('deleted'), 'success')
    } catch {
      showToast(t('deleteFailed'), 'error')
    }
  }

  const productsByCategory = (categoryId: string) =>
    products.filter(p => p.categoryId === categoryId)

  const saving = createCategoryMut.isPending || updateCategoryMut.isPending
    || createProductMut.isPending || updateProductMut.isPending

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
