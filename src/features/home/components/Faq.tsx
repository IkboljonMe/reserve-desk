import { FAQS, CARD, SECTION_TITLE, SECTION_SUB, type Translate } from '../constants'

export function Faq({ t }: { t: Translate }) {
  return (
    <section id="faq" className="max-w-[1200px] mx-auto px-5 lg:px-10 py-14">
      <h2 className={SECTION_TITLE}>FAQ</h2>
      <p className={SECTION_SUB}>{t('lpFaqSub')}</p>
      <div className="flex flex-col gap-3">
        {FAQS.map(({ q, a }) => (
          <details key={q} className={`${CARD} bg-white px-[1.4rem] py-[1.1rem]`}>
            <summary className="font-bold text-[0.95rem] cursor-pointer text-slate-900">{t(q)}</summary>
            <p className="text-slate-500 text-[0.9rem] leading-relaxed mt-2.5">{t(a)}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
