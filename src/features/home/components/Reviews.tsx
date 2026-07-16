import { REVIEWS, CARD, SECTION_TITLE, SECTION_SUB, type Translate } from '../constants'

export function Reviews({ t }: { t: Translate }) {
  return (
    <section id="reviews" className="bg-white border-y border-slate-200">
      <div className="max-w-[1200px] mx-auto px-5 lg:px-10 py-14">
        <h2 className={SECTION_TITLE}>{t('lpReviewsTitle')}</h2>
        <p className={SECTION_SUB}>{t('lpReviewsSub')}</p>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          {REVIEWS.map(r => (
            <div key={r.name} className={`${CARD} bg-slate-50 p-6 flex flex-col gap-3.5`}>
              <div className="text-warning tracking-[2px] text-[0.9rem]">★★★★★</div>
              <p className="text-slate-700 text-[0.925rem] leading-relaxed flex-1">
                “{t(r.quoteKey)}”
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full shrink-0 bg-[image:var(--brand-gradient)] flex items-center justify-center text-white font-bold">
                  {r.initial}
                </div>
                <div>
                  <div className="font-bold text-[0.9rem]">{r.name}</div>
                  <div className="text-slate-500 text-[0.78rem]">{t(r.hotelKey)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
