import { ShieldCheck } from 'lucide-react'
import { PLANS, CARD, SECTION_TITLE, SECTION_SUB, type Translate } from '../constants'

export function Pricing({ t, demoUrl }: { t: Translate; demoUrl: string }) {
  return (
    <section id="pricing" className="bg-white border-y border-slate-200">
      <div className="max-w-285 mx-auto px-6 py-14">
        <h2 className={SECTION_TITLE}>{t('pricingTitle')}</h2>
        <p className={SECTION_SUB}>{t('lpPricingSub')}</p>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5 items-stretch">
          {PLANS.map(plan => (
            <div
              key={plan.key}
              className={`${CARD} bg-white p-[1.9rem] relative flex flex-col ${plan.highlight ? 'border-2! border-brand-500! shadow-[0_12px_36px_rgba(79,110,247,0.18)]!' : ''}`}
            >
              {plan.highlight && (
                <span className="absolute -top-3.25 left-1/2 -translate-x-1/2 bg-[image:var(--brand-gradient)] text-white text-[0.72rem] font-bold px-3.5 py-1 rounded-full whitespace-nowrap">
                  {t('mostPopular')}
                </span>
              )}
              <h3 className="text-[1.05rem] font-extrabold mb-1">{t(`plan_${plan.key}`)}</h3>
              <div className="text-[1.9rem] font-extrabold tracking-[-0.02em] mb-1">
                {plan.price}
                <span className="text-[0.85rem] font-medium text-slate-500"> {t('lpUzsPerMonth')}</span>
              </div>
              <p className="text-slate-500 text-[0.83rem] mb-4.5">{t(`plan_${plan.key}_desc`)}</p>

              <ul className="list-none p-0 mt-0 mb-5.5 flex flex-col gap-2.25 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex gap-2 items-start text-[0.85rem] text-slate-700">
                    <ShieldCheck size={15} className="text-success shrink-0 mt-0.5" />
                    {t(f)}
                  </li>
                ))}
              </ul>

              <a
                href={demoUrl}
                className={`block text-center py-2.75 rounded-[10px] no-underline font-bold text-[0.9rem] ${plan.highlight
                  ? 'bg-[linear-gradient(135deg,#4f6ef7,#3b5bdb)] text-white shadow-[0_6px_18px_rgba(79,110,247,0.3)]'
                  : 'bg-brand-50 text-[#3b5bdb]'}`}
              >
                {t('lpTryFree')}
              </a>
            </div>
          ))}
        </div>
        <p className="text-center text-slate-500 text-[0.83rem] mt-5">
          {t('lpPricingContact')}
        </p>
      </div>
    </section>
  )
}
