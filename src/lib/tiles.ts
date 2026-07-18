import type { TileId, TileConfig } from '@/models/HotelMenuSettings'

export type { TileId, TileConfig }

export type HubLang = 'uz' | 'ru' | 'en'

export interface ResolvedTile {
  id: TileId
  enabled: boolean
  sortOrder: number
  emoji: string
  label: Record<HubLang, string>
}

// Default icon + labels for each tile type.
export const TILE_META: Record<TileId, { emoji: string; label: Record<HubLang, string>; sortOrder: number }> = {
  alarm:     { emoji: '⏰', sortOrder: 0, label: { uz: 'Budilnik',                    ru: 'Будильник',            en: 'Wake-up call'     } },
  services:  { emoji: '🏨', sortOrder: 1, label: { uz: 'Xizmatlar',                   ru: 'Услуги',               en: 'Services'         } },
  taxi:      { emoji: '🚖', sortOrder: 2, label: { uz: 'Taksi chaqirish',             ru: 'Вызов такси',          en: 'Call taxi'        } },
  reception: { emoji: '🛎️', sortOrder: 3, label: { uz: 'Qabulxona',                  ru: 'Рецепция',             en: 'Reception'        } },
  problem:   { emoji: '⚠️', sortOrder: 4, label: { uz: 'Muammo haqida xabar berish', ru: 'Сообщить о проблеме',  en: 'Report a problem' } },
  menu:      { emoji: '🍽️', sortOrder: 5, label: { uz: 'Menyu',                      ru: 'Меню',                 en: 'Menu'             } },
  reviews:   { emoji: '⭐', sortOrder: 6, label: { uz: 'Sharh qoldirish',             ru: 'Оставить отзыв',       en: 'Leave a review'   } },
  wifi:      { emoji: '📶', sortOrder: 7, label: { uz: 'Wi-Fi',                       ru: 'Wi-Fi',                en: 'Wi-Fi'            } },
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
      emoji: meta.emoji,
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
