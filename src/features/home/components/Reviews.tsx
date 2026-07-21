import {
  REVIEWS,
  SECTION_TITLE,
  SECTION_SUB,
  type Translate,
} from "../constants";
import { ReviewsCarousel } from "./ReviewsCarousel";

export function Reviews({ t }: { t: Translate }) {
  const reviews = REVIEWS.map((r) => ({
    name: r.name,
    initial: r.initial,
    hotel: t(r.hotelKey),
    quote: t(r.quoteKey),
  }));

  return (
    <section id="reviews" className="bg-white border-y border-slate-200">
      <div className="max-w-300 mx-auto px-5 lg:px-10 py-14">
        <h2 className={SECTION_TITLE}>{t("lpReviewsTitle")}</h2>
        <p className={SECTION_SUB}>{t("lpReviewsSub")}</p>

        <ReviewsCarousel
          reviews={reviews}
          prevLabel={t("previous")}
          nextLabel={t("next")}
        />
      </div>
    </section>
  );
}
