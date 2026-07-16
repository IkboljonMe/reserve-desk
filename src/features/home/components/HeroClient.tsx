'use client'

import Image from 'next/image'
import { ChevronRight, Sparkles } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

interface Props {
  badge: string
  title1: string
  title2: string
  subtitle: string
  ctaLabel: string
  pricingLabel: string
  demoUrl: string
  scrollLabel: string
}

export function HeroClient({ badge, title1, title2, subtitle, ctaLabel, pricingLabel, demoUrl }: Props) {
  return (
    <section className="relative w-full pt-24 pb-12 sm:pt-32 sm:pb-16 flex flex-col items-center justify-center bg-slate-50 text-slate-900">
      {/* Hero content */}
      <div className="relative z-10 max-w-[820px] px-6 text-center mb-10 md:mb-14">
        <div className="inline-flex items-center gap-2 mb-[22px] px-3.5 py-1.5 rounded-full bg-[#4f6ef7]/10 border border-[#4f6ef7]/20 text-[#3b5bdb] text-[0.8rem] font-semibold">
          <Sparkles size={14} /> {badge}
        </div>
        <h1 className="text-[2.2rem] sm:text-[5vw] md:text-[3.8rem] font-extrabold tracking-tight leading-[1.08] mb-[1.1rem] text-[#0f172a]">
          {title1} <span className="bg-[linear-gradient(135deg,#4f6ef7,#7c3aed)] bg-clip-text text-transparent">{title2}</span>
        </h1>
        <p className="text-slate-600 text-base sm:text-lg md:text-[1.2rem] leading-relaxed mx-auto mb-8 max-w-[640px]">{subtitle}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a
            href={demoUrl}
            className="px-[30px] py-[14px] rounded-xl no-underline bg-[linear-gradient(135deg,#4f6ef7,#3b5bdb)] text-white font-bold shadow-[0_8px_24px_rgba(79,110,247,0.35)] inline-flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(79,110,247,0.45)]"
          >
            {ctaLabel} <ChevronRight size={18} />
          </a>
          <a
            href="#pricing"
            className="px-[30px] py-[14px] rounded-xl no-underline bg-white/90 text-slate-900 border border-slate-200 font-semibold inline-flex items-center transition-all duration-300 hover:bg-white hover:border-slate-300 hover:-translate-y-0.5"
          >
            {pricingLabel}
          </a>
        </div>
      </div>

      {/* Swiper Banner - w-full */}
      <div className="w-full px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-xl border border-slate-200/60 bg-white">
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            spaceBetween={0}
            slidesPerView={1}
            loop={true}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            pagination={{ clickable: true }}
            className="w-full aspect-[16/9] md:aspect-[21/9]"
          >
            <SwiperSlide className="relative w-full h-full">
              <Image
                src="/assets/hero-banner.png"
                alt="Bronit Banner"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 1280px"
                className="object-cover"
              />
            </SwiperSlide>
          </Swiper>
        </div>
      </div>
    </section>
  )
}
