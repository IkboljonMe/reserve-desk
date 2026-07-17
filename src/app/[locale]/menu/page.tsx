import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Types } from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Company } from '@/models/Company'
import { Hotel } from '@/models/Hotel'
import { MenuCategory } from '@/models/MenuCategory'
import { MenuProduct } from '@/models/MenuProduct'
import { getSubdomain } from '@/lib/subdomain'
import { getT } from '@/i18n/dictionary'
import { GuestMenu } from '@/features/menu/guest/GuestMenu'
import type { MenuCategory as TCategory, MenuProduct as TProduct } from '@/features/menu/types'

// Public, read-only guest menu. Reached via a company subdomain that the proxy
// rewrites here: fergana.bronit.uz/<locale>/menu?hotel=<slug>&room=<n>.
export default async function GuestMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ hotel?: string; room?: string }>
}) {
  const { locale } = await params
  const { hotel: hotelSlug, room } = await searchParams

  // The company is identified by the request's subdomain (its slug).
  const host = (await headers()).get('host') || ''
  const companySlug = getSubdomain(host)
  if (!companySlug) notFound()

  await connectDB()
  const company = await Company.findOne({ slug: companySlug }).select('_id').lean<{ _id: Types.ObjectId } | null>()
  if (!company) notFound()

  // Resolve the hotel: explicit ?hotel=<slug>, else the company's only hotel.
  const hotels = await Hotel.find({ companyId: company._id })
    .select('_id name slug shortName')
    .lean<Array<{ _id: Types.ObjectId; name: string; slug?: string; shortName: string }>>()
  const hotel = hotelSlug ? hotels.find(h => h.slug === hotelSlug) : (hotels.length === 1 ? hotels[0] : undefined)
  if (!hotel) notFound()

  const [categories, products] = await Promise.all([
    MenuCategory.find({ hotelId: hotel._id }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
    MenuProduct.find({ hotelId: hotel._id, available: true }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
  ])

  const serialize = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

  return (
    <GuestMenu
      t={getT(locale)}
      locale={locale}
      hotelName={hotel.name}
      hotelSlug={hotel.slug || ''}
      room={typeof room === 'string' ? room : ''}
      categories={serialize(categories) as unknown as TCategory[]}
      products={serialize(products) as unknown as TProduct[]}
    />
  )
}
