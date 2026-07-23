'use client'

import { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperType } from 'swiper'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CARD } from '../constants'

import 'swiper/css'

interface Review {
  name: string
  initial: string
  hotel: string
  quote: string
}

interface Props {
  reviews: Review[]
  prevLabel: string
  nextLabel: string
}

// Client carousel for the marketing reviews: 3 cards per view on desktop, 1 on
// mobile. Navigation buttons are rendered by us (not Swiper's default side
// arrows) so we can center them under the cards.
export function ReviewsCarousel({ reviews, prevLabel, nextLabel }: Props) {
  const swiperRef = useRef<SwiperType | null>(null)

  return (
    <div>
      <Swiper
        onSwiper={s => { swiperRef.current = s }}
        spaceBetween={20}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        className="w-full"
      >
        {reviews.map(r => (
          <SwiperSlide key={r.name} className="!h-auto">
            <div className={`${CARD} bg-slate-50 p-6 flex flex-col gap-3.5 h-full`}>
              <div className="text-warning tracking-[2px] text-[0.9rem]">★★★★★</div>
              <p className="text-slate-700 text-[0.925rem] leading-relaxed flex-1">
                “{r.quote}”
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full shrink-0 bg-[image:var(--brand-gradient)] flex items-center justify-center text-white font-bold">
                  {r.initial}
                </div>
                <div>
                  <div className="font-bold text-[0.9rem]">{r.name}</div>
                  <div className="text-slate-500 text-[0.78rem]">{r.hotel}</div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation buttons — centered under the cards, 20px below */}
      <div className="flex justify-center items-center gap-3 mt-5">
        <button
          type="button"
          aria-label={prevLabel}
          onClick={() => swiperRef.current?.slidePrev()}
          className="w-10 h-10 inline-flex items-center justify-center border border-slate-200 bg-white text-slate-700 cursor-pointer transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          aria-label={nextLabel}
          onClick={() => swiperRef.current?.slideNext()}
          className="w-10 h-10 inline-flex items-center justify-center border border-slate-200 bg-white text-slate-700 cursor-pointer transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
