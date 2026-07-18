/**
 * Phase 1 sanity check — no database required.
 * Registers every menu model and builds a sample document to exercise schema
 * casting, defaults and validation. Run: npx tsx scripts/menu-models-check.ts
 */
import mongoose from 'mongoose'
import { MenuCategory } from '../src/models/MenuCategory'
import { MenuProduct } from '../src/models/MenuProduct'
import { MenuRecommendation } from '../src/models/MenuRecommendation'
import { GuestService } from '../src/models/GuestService'
import { HotelMenuSettings } from '../src/models/HotelMenuSettings'

const models = { MenuCategory, MenuProduct, MenuRecommendation, GuestService, HotelMenuSettings }
for (const [name, M] of Object.entries(models)) {
  console.log(`✓ registered ${name} → collection "${M.collection.name}"`)
}

const id = () => new mongoose.Types.ObjectId()

// Exercise casting + defaults + validation without touching a DB.
const product = new MenuProduct({
  companyId: id(), hotelId: id(), categoryId: id(),
  name: 'Tea', price: 12000,
  nameI18n: { en: 'Tea', ru: 'Чай', uz: 'Choy' },
})
const pErr = product.validateSync()
console.log('MenuProduct sample valid:', !pErr,
  '| nameI18n.uz =', product.nameI18n.uz,
  '| descI18n.en (default) =', JSON.stringify(product.descI18n.en),
  '| available (default) =', product.available)

const settings = new HotelMenuSettings({ companyId: id(), hotelId: id() })
const sErr = settings.validateSync()
console.log('HotelMenuSettings sample valid:', !sErr,
  '| menuEnabled (default) =', settings.menuEnabled,
  '| serviceFeeType (default) =', settings.serviceFeeType)

// Enum guard should fail.
const bad = new HotelMenuSettings({ companyId: id(), hotelId: id(), serviceFeeType: 'bogus' as never })
console.log('Enum validation catches bad serviceFeeType:', !!bad.validateSync())

process.exit(0)
