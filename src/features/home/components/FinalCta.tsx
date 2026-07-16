import { ChevronRight } from 'lucide-react'
import type { Translate } from '../constants'

export function FinalCta({ t, demoUrl }: { t: Translate; demoUrl: string }) {
  return (
    <section className="max-w-285 mx-auto px-6 pb-16">
      <div className="lp-final-cta rounded-[22px] px-8 py-12 text-center bg-[linear-gradient(135deg,#14192a_0%,#1e2540_60%,#2a1e55_100%)] shadow-[0_24px_60px_rgba(15,23,42,0.35)]">
        <h2 className="text-white text-[clamp(1.4rem,3vw,2rem)] font-extrabold tracking-[-0.02em] mb-2.5">
          {t('lpFinalCtaTitle')}
        </h2>
        <p className="text-white/65 max-w-135 mx-auto mb-7 text-[0.975rem] leading-relaxed">
          {t('lpFinalCtaSub')}
        </p>
        <a
          href={demoUrl}
          className="inline-flex items-center gap-2 px-7.5 py-3.25 rounded-xl no-underline bg-[image:var(--brand-gradient)] text-white font-bold shadow-[0_8px_24px_rgba(99,102,241,0.45)]"
        >
          {t('lpHeroCta')} <ChevronRight size={18} />
        </a>
      </div>
    </section>
  )
}
