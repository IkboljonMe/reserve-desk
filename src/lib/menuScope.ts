import type { Types } from 'mongoose'
import { Company } from '@/models/Company'

// Resolves which hotel's menu content (categories/products/recommendations) a
// given hotel should display. In 'shared' mode every hotel shows the source
// hotel's menu; in 'per_hotel' mode each hotel shows its own. Falls back to the
// requested hotel when a shared source isn't set. Assumes an open DB connection.
export async function resolveMenuHotelId(
  companyId: Types.ObjectId | string,
  requestedHotelId: Types.ObjectId | string,
): Promise<Types.ObjectId | string> {
  const company = await Company.findById(companyId)
    .select('menuMode menuSourceHotelId')
    .lean<{ menuMode?: string; menuSourceHotelId?: Types.ObjectId | null } | null>()
  if (company?.menuMode === 'shared' && company.menuSourceHotelId) {
    return company.menuSourceHotelId
  }
  return requestedHotelId
}
