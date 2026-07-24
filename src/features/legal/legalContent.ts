// Content for the Privacy Policy and Terms of Use pages, per locale. This is a
// concise, generic starting template — it should be reviewed by legal counsel
// and adjusted to Bronit's actual data practices before being relied upon.

export type LegalDoc = "privacy" | "terms";

export interface LegalSection {
  heading: string;
  body: string;
}
export interface LegalContent {
  title: string;
  updated: string; // human-readable "last updated" line
  intro: string;
  sections: LegalSection[];
}

type Locale = "en" | "uz" | "ru";

const LAST_UPDATED: Record<Locale, string> = {
  en: "Last updated: 24 July 2026",
  uz: "Oxirgi yangilanish: 2026-yil 24-iyul",
  ru: "Последнее обновление: 24 июля 2026 г.",
};

export const LEGAL: Record<LegalDoc, Record<Locale, LegalContent>> = {
  privacy: {
    en: {
      title: "Privacy Policy",
      updated: LAST_UPDATED.en,
      intro:
        "Bronit (“we”, “us”) provides a booking-management platform for hotels. This policy explains what data we collect and how we use it.",
      sections: [
        {
          heading: "Information we collect",
          body: "Account details you provide (name, phone, email) and the operational data you enter into the platform — bookings, clients, contracts, menu items and payment records.",
        },
        {
          heading: "How we use it",
          body: "To operate the service, run your bookings and payments, send the notifications and reports you configure (including via Telegram), and provide support.",
        },
        {
          heading: "Sharing",
          body: "We do not sell your data. We share it only with service providers needed to run the platform (e.g. Telegram for notifications) and where required by law.",
        },
        {
          heading: "Retention & security",
          body: "We keep your data while your account is active and take reasonable measures to protect it. You can request deletion of your account data at any time.",
        },
        {
          heading: "Contact",
          body: "For any privacy request, contact us on Telegram (@bronituz) or through the contact form on bronit.uz.",
        },
      ],
    },
    uz: {
      title: "Maxfiylik siyosati",
      updated: LAST_UPDATED.uz,
      intro:
        "Bronit (“biz”) mehmonxonalar uchun bron boshqaruv platformasini taqdim etadi. Ushbu siyosat qanday ma'lumot to'plashimiz va undan qanday foydalanishimizni tushuntiradi.",
      sections: [
        {
          heading: "Qanday ma'lumot to'playmiz",
          body: "Siz taqdim etgan hisob ma'lumotlari (ism, telefon, e-pochta) va platformaga kiritgan operatsion ma'lumotlaringiz — bronlar, mijozlar, shartnomalar, menyu va to'lovlar.",
        },
        {
          heading: "Ulardan qanday foydalanamiz",
          body: "Xizmatni yuritish, bronlar va to'lovlaringizni boshqarish, siz sozlagan bildirishnoma va hisobotlarni (jumladan Telegram orqali) yuborish hamda qo'llab-quvvatlash uchun.",
        },
        {
          heading: "Ma'lumot ulashish",
          body: "Biz ma'lumotlaringizni sotmaymiz. Uni faqat platformani ishlatish uchun zarur xizmat provayderlari bilan (masalan, bildirishnomalar uchun Telegram) va qonun talab qilgan hollarda ulashamiz.",
        },
        {
          heading: "Saqlash va xavfsizlik",
          body: "Hisobingiz faol bo'lganda ma'lumotlaringizni saqlaymiz va uni himoya qilish uchun oqilona choralar ko'ramiz. Istalgan vaqtda hisob ma'lumotlaringizni o'chirishni so'rashingiz mumkin.",
        },
        {
          heading: "Bog'lanish",
          body: "Har qanday maxfiylik so'rovi uchun Telegram (@bronituz) yoki bronit.uz'dagi aloqa formasi orqali biz bilan bog'laning.",
        },
      ],
    },
    ru: {
      title: "Политика конфиденциальности",
      updated: LAST_UPDATED.ru,
      intro:
        "Bronit (“мы”) предоставляет платформу управления бронированиями для отелей. Эта политика объясняет, какие данные мы собираем и как их используем.",
      sections: [
        {
          heading: "Какие данные мы собираем",
          body: "Данные аккаунта, которые вы предоставляете (имя, телефон, эл. почта), и операционные данные, которые вы вводите в платформу — брони, клиенты, договоры, меню и платежи.",
        },
        {
          heading: "Как мы их используем",
          body: "Для работы сервиса, ведения ваших броней и платежей, отправки настроенных вами уведомлений и отчётов (в том числе через Telegram) и поддержки.",
        },
        {
          heading: "Передача данных",
          body: "Мы не продаём ваши данные. Мы передаём их только поставщикам услуг, необходимым для работы платформы (например, Telegram для уведомлений), и когда этого требует закон.",
        },
        {
          heading: "Хранение и безопасность",
          body: "Мы храним ваши данные, пока аккаунт активен, и принимаем разумные меры для их защиты. Вы можете в любой момент запросить удаление данных аккаунта.",
        },
        {
          heading: "Контакты",
          body: "По любым вопросам конфиденциальности пишите нам в Telegram (@bronituz) или через форму обратной связи на bronit.uz.",
        },
      ],
    },
  },
  terms: {
    en: {
      title: "Terms of Use",
      updated: LAST_UPDATED.en,
      intro:
        "These terms govern your use of Bronit. By creating an account or using the service, you agree to them.",
      sections: [
        {
          heading: "The service",
          body: "Bronit is a subscription platform for managing hotel bookings, payments, contracts and guest orders. We may update or improve features over time.",
        },
        {
          heading: "Your account",
          body: "You are responsible for keeping your login credentials secure, for the accuracy of the data you enter, and for the activity of the staff accounts you create.",
        },
        {
          heading: "Payments & subscriptions",
          body: "Subscriptions are billed monthly per hotel at the plan price shown. Access may be limited if a subscription lapses. Onboarding is arranged with our team after sign-up.",
        },
        {
          heading: "Acceptable use",
          body: "Do not misuse the platform, attempt to disrupt it, or use it for unlawful purposes. We may suspend accounts that violate these terms.",
        },
        {
          heading: "Liability & contact",
          body: "The service is provided “as is”; we are not liable for indirect or incidental damages. Questions? Contact us on Telegram (@bronituz) or via bronit.uz.",
        },
      ],
    },
    uz: {
      title: "Foydalanish shartlari",
      updated: LAST_UPDATED.uz,
      intro:
        "Ushbu shartlar Bronit'dan foydalanishingizni tartibga soladi. Hisob yaratib yoki xizmatdan foydalanib, siz ularga rozilik bildirasiz.",
      sections: [
        {
          heading: "Xizmat",
          body: "Bronit — mehmonxona bronlari, to'lovlari, shartnomalari va mehmon buyurtmalarini boshqarish uchun obuna platformasi. Vaqt o'tishi bilan imkoniyatlarni yangilashimiz mumkin.",
        },
        {
          heading: "Hisobingiz",
          body: "Kirish ma'lumotlaringiz xavfsizligi, kiritgan ma'lumotlaringiz aniqligi va siz yaratgan xodim hisoblari faoliyati uchun siz javobgarsiz.",
        },
        {
          heading: "To'lovlar va obuna",
          body: "Obuna har bir mehmonxona uchun oyiga ko'rsatilgan tarif narxida hisoblanadi. Obuna tugasa, kirish cheklanishi mumkin. Sozlash ro'yxatdan o'tgach jamoamiz bilan tashkil etiladi.",
        },
        {
          heading: "Maqbul foydalanish",
          body: "Platformadan suiiste'mol qilmang, uni ishdan chiqarishga urinmang yoki noqonuniy maqsadlarda foydalanmang. Shartlarni buzgan hisoblarni to'xtatishimiz mumkin.",
        },
        {
          heading: "Javobgarlik va bog'lanish",
          body: "Xizmat “bor holicha” taqdim etiladi; biz bilvosita yoki tasodifiy zararlar uchun javobgar emasmiz. Savollar? Telegram (@bronituz) yoki bronit.uz orqali bog'laning.",
        },
      ],
    },
    ru: {
      title: "Условия использования",
      updated: LAST_UPDATED.ru,
      intro:
        "Эти условия регулируют использование Bronit. Создавая аккаунт или пользуясь сервисом, вы соглашаетесь с ними.",
      sections: [
        {
          heading: "Сервис",
          body: "Bronit — платформа по подписке для управления бронированиями отеля, платежами, договорами и заказами гостей. Со временем мы можем обновлять функции.",
        },
        {
          heading: "Ваш аккаунт",
          body: "Вы отвечаете за сохранность своих учётных данных, за точность вводимых данных и за действия создаваемых вами учётных записей сотрудников.",
        },
        {
          heading: "Платежи и подписка",
          body: "Подписка тарифицируется ежемесячно за каждый отель по указанной цене тарифа. При окончании подписки доступ может быть ограничен. Настройку организует наша команда после регистрации.",
        },
        {
          heading: "Допустимое использование",
          body: "Не злоупотребляйте платформой, не пытайтесь нарушить её работу и не используйте в противоправных целях. Мы можем приостановить аккаунты, нарушающие эти условия.",
        },
        {
          heading: "Ответственность и контакты",
          body: "Сервис предоставляется “как есть”; мы не несём ответственности за косвенный или случайный ущерб. Вопросы? Пишите в Telegram (@bronituz) или на bronit.uz.",
        },
      ],
    },
  },
};

export function getLegal(doc: LegalDoc, locale: string): LegalContent {
  const l = (["en", "uz", "ru"].includes(locale) ? locale : "en") as Locale;
  return LEGAL[doc][l];
}
