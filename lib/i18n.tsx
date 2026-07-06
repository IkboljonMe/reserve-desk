'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type LanguageCode = 'en' | 'uz' | 'ru'

const DICTIONARY = {
  en: {
    services: "Services",
    newBooking: "New Booking",
    calendar: "Calendar",
    settings: "Settings",
    general: "General",
    signOut: "Sign out",
    addService: "Add Service",
    price: "Price",
    isFree: "Free Service",
    details: "Details / Equipment",
    capacity: "Capacity",
    location: "Location",
    bookable: "Bookable",
    active: "Active",
    inactive: "Inactive",
    save: "Save Changes",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    status: "Status",
    timeSlots: "Time Slots",
    guestInfo: "Guest Information",
  },
  uz: {
    services: "Xizmatlar",
    newBooking: "Yangi buyurtma",
    calendar: "Taqvim",
    settings: "Sozlamalar",
    general: "Umumiy",
    signOut: "Chiqish",
    addService: "Xizmat qo'shish",
    price: "Narx",
    isFree: "Bepul xizmat",
    details: "Tafsilotlar / Jihozlar",
    capacity: "Kishilik (Sig'im)",
    location: "Joylashuv",
    bookable: "Band qilish",
    active: "Faol",
    inactive: "Faol emas",
    save: "Saqlash",
    cancel: "Bekor qilish",
    delete: "O'chirish",
    edit: "Tahrirlash",
    status: "Holat",
    timeSlots: "Vaqt oraliqlari",
    guestInfo: "Mehmon ma'lumotlari",
  },
  ru: {
    services: "Услуги",
    newBooking: "Новое бронирование",
    calendar: "Календарь",
    settings: "Настройки",
    general: "Общие",
    signOut: "Выйти",
    addService: "Добавить услугу",
    price: "Цена",
    isFree: "Бесплатная услуга",
    details: "Детали / Оборудование",
    capacity: "Вместимость",
    location: "Расположение",
    bookable: "Доступно для бронирования",
    active: "Активный",
    inactive: "Неактивный",
    save: "Сохранить",
    cancel: "Отмена",
    delete: "Удалить",
    edit: "Изменить",
    status: "Статус",
    timeSlots: "Временные интервалы",
    guestInfo: "Информация о госте",
  }
}

type DictionaryKeys = keyof typeof DICTIONARY['en']

interface LanguageContextType {
  lang: LanguageCode
  setLang: (lang: LanguageCode) => void
  t: (key: DictionaryKeys) => string
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'uz', // default to UZ as requested
  setLang: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>('uz')

  useEffect(() => {
    const saved = localStorage.getItem('appLang') as LanguageCode
    if (saved && ['en', 'uz', 'ru'].includes(saved)) {
      setLangState(saved)
    }
  }, [])

  const setLang = (newLang: LanguageCode) => {
    setLangState(newLang)
    localStorage.setItem('appLang', newLang)
  }

  const t = (key: DictionaryKeys): string => {
    return DICTIONARY[lang][key] || DICTIONARY['en'][key] || key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  return useContext(LanguageContext)
}
