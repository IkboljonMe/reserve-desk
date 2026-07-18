'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ToastProvider'
import { useTranslation } from '@/i18n'
import { ALL_TILE_IDS, TILE_META, resolveTiles } from '@/lib/tiles'
import type { TileConfig } from '@/models/HotelMenuSettings'
import type { ResolvedTile } from '@/lib/tiles'

export interface MenuSettingsForm {
  menuEnabled: boolean
  bannerUrl: string
  logoUrl: string
  receptionPhone: string
  wifiName: string
  wifiPassword: string
  instagramUrl: string
  telegramUrl: string
  tripadvisorUrl: string
  googleMapsUrl: string
  yandexMapsUrl: string
  serviceFeeType: 'none' | 'percent' | 'fixed'
  serviceFeeValue: number
  tiles: ResolvedTile[]
}

async function fetchSettings(hotelId: string): Promise<Partial<Omit<MenuSettingsForm, 'tiles'> & { tiles: TileConfig[] }>> {
  const r = await fetch(`/api/menu/settings?hotelId=${encodeURIComponent(hotelId)}`)
  if (!r.ok) throw new Error('Failed to fetch settings')
  return r.json()
}

async function saveSettings(data: { hotelId: string } & Partial<Omit<MenuSettingsForm, 'tiles'> & { tiles: TileConfig[] }>) {
  const r = await fetch('/api/menu/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!r.ok) throw new Error('Failed to save')
  return r.json()
}

export function useMenuSettings(hotelId: string) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['menu', 'settings', hotelId],
    queryFn: () => fetchSettings(hotelId),
    enabled: !!hotelId,
  })

  const [form, setForm] = useState<MenuSettingsForm>({
    menuEnabled: true,
    bannerUrl: '', logoUrl: '', receptionPhone: '',
    wifiName: '', wifiPassword: '',
    instagramUrl: '', telegramUrl: '',
    tripadvisorUrl: '', googleMapsUrl: '', yandexMapsUrl: '',
    serviceFeeType: 'none', serviceFeeValue: 0,
    tiles: resolveTiles([]),
  })

  // Populate form when data loads
  useEffect(() => {
    if (!query.data) return
    const d = query.data
    setForm({
      menuEnabled: d.menuEnabled ?? true,
      bannerUrl: d.bannerUrl ?? '',
      logoUrl: d.logoUrl ?? '',
      receptionPhone: d.receptionPhone ?? '',
      wifiName: d.wifiName ?? '',
      wifiPassword: d.wifiPassword ?? '',
      instagramUrl: d.instagramUrl ?? '',
      telegramUrl: d.telegramUrl ?? '',
      tripadvisorUrl: d.tripadvisorUrl ?? '',
      googleMapsUrl: d.googleMapsUrl ?? '',
      yandexMapsUrl: d.yandexMapsUrl ?? '',
      serviceFeeType: (d.serviceFeeType as MenuSettingsForm['serviceFeeType']) ?? 'none',
      serviceFeeValue: d.serviceFeeValue ?? 0,
      tiles: resolveTiles((d.tiles as TileConfig[]) ?? []),
    })
  }, [query.data])

  const mutation = useMutation({
    mutationFn: (data: typeof form) => {
      const tiles: TileConfig[] = data.tiles.map((tile, i) => ({
        id: tile.id,
        enabled: tile.enabled,
        sortOrder: i,
        labelUz: tile.label.uz !== TILE_META[tile.id].label.uz ? tile.label.uz : '',
        labelRu: tile.label.ru !== TILE_META[tile.id].label.ru ? tile.label.ru : '',
        labelEn: tile.label.en !== TILE_META[tile.id].label.en ? tile.label.en : '',
      }))
      return saveSettings({ hotelId, ...data, tiles })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu', 'settings', hotelId] })
      showToast(t('saved'), 'success')
    },
    onError: () => showToast(t('saveFailed'), 'error'),
  })

  const setField = <K extends keyof MenuSettingsForm>(key: K, value: MenuSettingsForm[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  const toggleTile = (id: string) =>
    setForm(f => ({ ...f, tiles: f.tiles.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t) }))

  const save = () => mutation.mutate(form)

  return { form, setField, toggleTile, save, loading: query.isLoading, saving: mutation.isPending }
}
