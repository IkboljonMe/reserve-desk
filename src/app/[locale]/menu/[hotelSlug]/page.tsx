import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import type { Types } from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Hotel } from '@/models/Hotel'
import { HotelMenuSettings } from '@/models/HotelMenuSettings'
import { resolveTiles } from '@/lib/tiles'
import { GuestHubClient } from '@/features/menu/guest/GuestHubClient'
import { getT } from '@/i18n/dictionary'

// Public guest hub — a hotel's landing page with service tiles.
// URL: menu.bronit.uz/<locale>/<hotelSlug>[?room=<n>]
// No auth — the hotel slug is globally unique.
export default async function GuestHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; hotelSlug: string }>
  searchParams: Promise<{ room?: string }>
}) {
  const { locale, hotelSlug } = await params
  const { room } = await searchParams
  const t = getT(locale)

  const hdrs = await headers()
  const isMenuSub = hdrs.get('x-subdomain') === 'menu'

  await connectDB()

  const hotel = await Hotel.findOne({ slug: hotelSlug })
    .select('_id name slug companyId')
    .lean<{ _id: Types.ObjectId; name: string; slug?: string; companyId: Types.ObjectId } | null>()
  if (!hotel) notFound()

  const settings = await HotelMenuSettings.findOne({ hotelId: hotel._id })
    .lean<{
      bannerUrl?: string
      logoUrl?: string
      receptionPhone?: string
      wifiName?: string
      wifiPassword?: string
      instagramUrl?: string
      telegramUrl?: string
      tripadvisorUrl?: string
      googleMapsUrl?: string
      tiles?: NonNullable<unknown>[]
    } | null>()

  const tiles = resolveTiles((settings?.tiles as Parameters<typeof resolveTiles>[0]) ?? [])

  // First non-empty review URL becomes the reviews tile target.
  const reviewUrl = settings?.tripadvisorUrl || settings?.googleMapsUrl || ''

  return (
    <GuestHubClient
      isMenuSub={isMenuSub}
      hotelName={hotel.name}
      hotelSlug={hotel.slug || hotelSlug}
      logoUrl={settings?.logoUrl || ''}
      bannerUrl={settings?.bannerUrl || ''}
      room={typeof room === 'string' ? room : ''}
      locale={locale}
      tiles={tiles}
      wifiName={settings?.wifiName || ''}
      wifiPassword={settings?.wifiPassword || ''}
      instagramUrl={settings?.instagramUrl || ''}
      telegramUrl={settings?.telegramUrl || ''}
      receptionPhone={settings?.receptionPhone || ''}
      reviewUrl={reviewUrl}
    />
  )
}
