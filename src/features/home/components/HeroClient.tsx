"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { MainSlide } from "./head-slides/MainSlide";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

interface Props {
  badge: string;
  title1: string;
  title2: string;
  subtitle: string;
  ctaLabel: string;
  pricingLabel: string;
  demoUrl: string;
  scrollLabel: string;
}

export function HeroClient({
  badge,
  title1,
  title2,
  subtitle,
  ctaLabel,
  pricingLabel,
  demoUrl,
}: Props) {
  return (
    <section className="relative w-full pt-0 bg-slate-50 text-slate-900">
      {/* Swiper Banner - full-bleed edge-to-edge */}
      <div className="w-full">
        <div className="relative overflow-hidden w-full bg-slate-950">
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
            navigation={true}
            className="w-full aspect-375/400 md:aspect-768/600 lg:aspect-1920/600"
          >
            <SwiperSlide className="relative w-full h-full">
              <MainSlide
                badge={badge}
                title1={title1}
                title2={title2}
                subtitle={subtitle}
                ctaLabel={ctaLabel}
                pricingLabel={pricingLabel}
                demoUrl={demoUrl}
              />
            </SwiperSlide>
            <SwiperSlide className="relative w-full h-full">
              <MainSlide
                badge={badge}
                title1={title1}
                title2={title2}
                subtitle={subtitle}
                ctaLabel={ctaLabel}
                pricingLabel={pricingLabel}
                demoUrl={demoUrl}
              />
            </SwiperSlide>
            <SwiperSlide className="relative w-full h-full">
              <MainSlide
                badge={badge}
                title1={title1}
                title2={title2}
                subtitle={subtitle}
                ctaLabel={ctaLabel}
                pricingLabel={pricingLabel}
                demoUrl={demoUrl}
              />
            </SwiperSlide>
          </Swiper>
        </div>
      </div>
    </section>
  );
}
