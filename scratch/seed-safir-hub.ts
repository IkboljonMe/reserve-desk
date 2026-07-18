// Seed script — updates Safir Hotel's HotelMenuSettings with hub config.
// Run: node --import tsx scratch/seed-safir-hub.ts
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'

async function main() {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8')
  const mongoLine = envContent.split('\n').find((l: string) => l.startsWith('MONGODB_URI='))
  const uri = mongoLine ? mongoLine.substring('MONGODB_URI='.length).trim() : null
  if (!uri) throw new Error('MONGODB_URI not found in .env')

  await mongoose.connect(uri)

  const Hotel = mongoose.model('Hotel', new mongoose.Schema({ slug: String, name: String, companyId: mongoose.Types.ObjectId }))
  const hotel = await Hotel.findOne({ slug: 'safirhotel' }).lean() as { _id: mongoose.Types.ObjectId; companyId: mongoose.Types.ObjectId; name: string } | null
  if (!hotel) { console.error('Hotel safirhotel not found'); process.exit(1) }
  console.log('Found hotel:', hotel.name, hotel._id.toString())

  const HotelMenuSettings = mongoose.model('HotelMenuSettings', new mongoose.Schema({}, { strict: false }))
  const result = await HotelMenuSettings.findOneAndUpdate(
    { hotelId: hotel._id },
    {
      $set: {
        companyId: hotel.companyId,
        hotelId: hotel._id,
        menuEnabled: true,
        bannerUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80',
        logoUrl: '',
        receptionPhone: '+998 73 222 2222',
        wifiName: 'Safir_Hotel',
        wifiPassword: 'safir2024',
        instagramUrl: 'https://instagram.com/safirhotel.fergana',
        telegramUrl: 'https://t.me/safirhotel',
        googleMapsUrl: '',
        tripadvisorUrl: '',
        yandexMapsUrl: '',
        serviceFeeType: 'none',
        serviceFeeValue: 0,
        tiles: [
          { id: 'alarm',     enabled: true, sortOrder: 0, labelUz: 'Budilnik',                   labelRu: '\u0411\u0443\u0434\u0438\u043b\u044c\u043d\u0438\u043a',           labelEn: 'Wake-up call'     },
          { id: 'services',  enabled: true, sortOrder: 1, labelUz: 'Xizmatlar',                  labelRu: '\u0423\u0441\u043b\u0443\u0433\u0438',             labelEn: 'Services'         },
          { id: 'taxi',      enabled: true, sortOrder: 2, labelUz: 'Taksi chaqirish',            labelRu: '\u0412\u044b\u0437\u043e\u0432 \u0442\u0430\u043a\u0441\u0438',      labelEn: 'Call taxi'        },
          { id: 'reception', enabled: true, sortOrder: 3, labelUz: 'Qabulxona',                  labelRu: '\u0420\u0435\u0446\u0435\u043f\u0446\u0438\u044f',            labelEn: 'Reception'        },
          { id: 'problem',   enabled: true, sortOrder: 4, labelUz: 'Muammo haqida xabar berish', labelRu: '\u0421\u043e\u043e\u0431\u0449\u0438\u0442\u044c \u043e \u043f\u0440\u043e\u0431\u043b\u0435\u043c\u0435',labelEn: 'Report a problem' },
          { id: 'menu',      enabled: true, sortOrder: 5, labelUz: 'Menyu',                      labelRu: '\u041c\u0435\u043d\u044e',              labelEn: 'Menu'             },
          { id: 'reviews',   enabled: true, sortOrder: 6, labelUz: 'Sharh qoldirish',            labelRu: '\u041e\u0441\u0442\u0430\u0432\u0438\u0442\u044c \u043e\u0442\u0437\u044b\u0432',  labelEn: 'Leave a review'   },
          { id: 'wifi',      enabled: true, sortOrder: 7, labelUz: 'Wi-Fi',                      labelRu: 'Wi-Fi',            labelEn: 'Wi-Fi'            },
        ],
      },
    },
    { upsert: true, new: true },
  ).lean()

  console.log('\u2713 Safir Hotel hub settings saved')
  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
