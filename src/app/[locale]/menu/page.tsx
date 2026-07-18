import { notFound } from 'next/navigation'
import type { Types } from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Company } from '@/models/Company'
import { Hotel } from '@/models/Hotel'
import { MenuCategory } from '@/models/MenuCategory'
import { MenuProduct } from '@/models/MenuProduct'
import { MenuRecommendation } from '@/models/MenuRecommendation'
import { HotelMenuSettings } from '@/models/HotelMenuSettings'
import { nowUZ } from '@/lib/timezone'
import { getT } from '@/i18n/dictionary'
import { GuestMenuClient, type GuestLabels } from '@/features/menu/guest/GuestMenuClient'
import type { MenuCategory as TCategory, MenuProduct as TProduct } from '@/features/menu/types'

// Public, interactive guest menu. Reached via app.bronit.uz:
//   app.bronit.uz/<locale>/menu?hotel=<hotelSlug>&room=<n>
// No auth required — the hotel slug is globally unique so we resolve
// both hotel and company directly from the query parameter.
export default async function GuestMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ hotel?: string; room?: string }>
}) {
  const { locale } = await params
  const { hotel: hotelSlug, room } = await searchParams
  const t = getT(locale)

  // Resolve hotel directly by its globally-unique slug (no subdomain needed).
  if (!hotelSlug) notFound()

  await connectDB()
  const hotel = await Hotel.findOne({ slug: hotelSlug })
    .select('_id name slug shortName companyId')
    .lean<{ _id: Types.ObjectId; name: string; slug?: string; shortName: string; companyId: Types.ObjectId } | null>()
  if (!hotel) notFound()

  const company = await Company.findById(hotel.companyId).select('_id').lean<{ _id: Types.ObjectId } | null>()
  if (!company) notFound()

  const settings = await HotelMenuSettings.findOne({ hotelId: hotel._id })
    .select('menuEnabled serviceFeeType serviceFeeValue')
    .lean<{ menuEnabled: boolean; serviceFeeType: 'none' | 'percent' | 'fixed'; serviceFeeValue: number } | null>()

  if (!settings?.menuEnabled) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--surface-bg)] text-[var(--gray-400)] text-sm px-4 text-center">
        {t('menuEmpty')}
      </div>
    )
  }

  const [categories, products, recommendationDocs] = await Promise.all([
    MenuCategory.find({ hotelId: hotel._id }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
    MenuProduct.find({ hotelId: hotel._id, available: true }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
    MenuRecommendation.find({ hotelId: hotel._id, dayOfWeek: nowUZ().getDay() })
      .sort({ sortOrder: 1 })
      .populate('productId')
      .lean(),
  ])

  // Only today's picks that are still available (product may have been
  // deleted or hidden since it was featured).
  const recommendations = recommendationDocs
    .map(r => r.productId as unknown as TProduct & { available?: boolean })
    .filter(p => p && p.available !== false)

  const serialize = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

  const labels: GuestLabels = {
    room: t('room'), sum: t('sum'), menuEmpty: t('menuEmpty'), add: t('add'), total: t('total'),
    close: t('close'), cancel: t('cancel'),
    yourOrder: t('yourOrder'), viewOrder: t('viewOrder'), placeOrder: t('placeOrder'), placingOrder: t('placingOrder'),
    orderPlaced: t('orderPlaced'), orderPlacedDesc: t('orderPlacedDesc'), emptyCart: t('emptyCart'),
    subtotal: t('subtotal'), serviceFee: t('serviceFee'), roomNumber: t('roomNumber'),
    guestNamePlaceholder: t('guestNamePlaceholder'), orderNotePlaceholder: t('orderNotePlaceholder'),
    orderFailed: t('orderFailed'), roomRequiredError: t('roomRequiredError'),
    itemsN: n => t('cartItemsCount', { n }),
    cancelledTitle: t('cancelledTitle'), cancelledSub: t('cancelledSub'),
    orderNo: t('orderNo'), couldNotLoad: t('couldNotLoad'), backToMenu: t('backToMenu'), orderSummary: t('orderSummary'),
    notes: t('notes'),
    orderPending: t('orderPending'), orderPreparing: t('orderPreparing'), orderReady: t('orderReady'), orderDelivered: t('orderDelivered'),
    recommendedToday: t('recommendedToday'),
  }

  return (
    <GuestMenuClient
      labels={labels}
      locale={locale}
      hotelName={hotel.name}
      hotelSlug={hotel.slug || ''}
      room={typeof room === 'string' ? room : ''}
      categories={serialize(categories) as unknown as TCategory[]}
      products={serialize(products) as unknown as TProduct[]}
      recommendations={serialize(recommendations)}
      serviceFeeType={settings.serviceFeeType}
      serviceFeeValue={settings.serviceFeeValue}
    />
  )
}
