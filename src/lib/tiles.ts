import type { TileId, TileConfig } from '@/models/HotelMenuSettings'

export type { TileId, TileConfig }

export type HubLang = 'uz' | 'ru' | 'en'

export interface ResolvedTile {
  id: TileId
  enabled: boolean
  sortOrder: number
  icon: string
  label: Record<HubLang, string>
}

export const TILE_META: Record<TileId, { icon: string; label: Record<HubLang, string>; sortOrder: number }> = {
  alarm:     { icon: '/assets/menu-icons/clock.webp', sortOrder: 0, label: { uz: 'Budilnik',                    ru: 'Будильник',            en: 'Wake-up call'     } },
  services:  { icon: '/assets/menu-icons/services.webp', sortOrder: 1, label: { uz: 'Xizmatlar',                   ru: 'Услуги',               en: 'Services'         } },
  taxi:      { icon: '/assets/menu-icons/taxi.webp', sortOrder: 2, label: { uz: 'Taksi chaqirish',             ru: 'Вызов такси',          en: 'Call taxi'        } },
  reception: { icon: '/assets/menu-icons/reception.webp', sortOrder: 3, label: { uz: 'Qabulxona',                  ru: 'Рецепция',             en: 'Reception'        } },
  problem:   { icon: '/assets/menu-icons/report.webp', sortOrder: 4, label: { uz: 'Muammo haqida xabar berish', ru: 'Сообщить о проблеме',  en: 'Report a problem' } },
  menu:      { icon: '/assets/menu-icons/menu.webp', sortOrder: 5, label: { uz: 'Menyu',                      ru: 'Меню',                 en: 'Menu'             } },
  reviews:   { icon: '/assets/menu-icons/review.webp', sortOrder: 6, label: { uz: 'Sharh qoldirish',             ru: 'Оставить отзыв',       en: 'Leave a review'   } },
  wifi:      { icon: '/assets/menu-icons/wifi.webp', sortOrder: 7, label: { uz: 'Wi-Fi',                       ru: 'Wi-Fi',                en: 'Wi-Fi'            } },
}

export const ALL_TILE_IDS: TileId[] = ['alarm', 'services', 'taxi', 'reception', 'problem', 'menu', 'reviews', 'wifi']

/**
 * Merge stored tile configs with defaults.
 * - Any tile not present in `stored` is added with defaults + enabled=true.
 * - Custom labels in stored override the defaults.
 * - Result is sorted by sortOrder ascending.
 */
export function resolveTiles(stored: TileConfig[]): ResolvedTile[] {
  const map = new Map(stored.map(t => [t.id, t]))

  return ALL_TILE_IDS.map((id) => {
    const meta = TILE_META[id]
    const s = map.get(id)
    return {
      id,
      enabled: s?.enabled ?? true,
      sortOrder: s?.sortOrder ?? meta.sortOrder,
      icon: meta.icon,
      label: {
        uz: s?.labelUz || meta.label.uz,
        ru: s?.labelRu || meta.label.ru,
        en: s?.labelEn || meta.label.en,
      },
    }
  }).sort((a, b) => a.sortOrder - b.sortOrder)
}

export function getTileLabel(tile: ResolvedTile, lang: HubLang): string {
  return tile.label[lang] || tile.label.uz
}
