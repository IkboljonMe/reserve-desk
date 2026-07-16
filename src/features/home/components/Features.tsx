import { ShieldCheck } from 'lucide-react'
import { PILLARS, CARD, SECTION_TITLE, SECTION_SUB, type Translate } from '../constants'

export function Features({ t }: { t: Translate }) {
  return (
    <section id="features" className="max-w-[1200px] mx-auto px-5 lg:px-10 py-14">
      <h2 className={SECTION_TITLE}>{t('lpPillarsTitle')}</h2>
      <p className={SECTION_SUB}>{t('lpPillarsSub')}</p>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
        {PILLARS.map(({ icon: Icon, title, desc, points }) => (
          <div key={title} className={`${CARD} bg-white p-7`}>
            <div className="w-11 h-11 rounded-xl mb-4 flex items-center justify-center bg-brand-50 text-brand-500">
              <Icon size={22} />
            </div>
            <h3 className="text-[1.1rem] font-bold mb-2">{t(title)}</h3>
            <p className="text-slate-500 text-[0.9rem] leading-relaxed mb-3.5">{t(desc)}</p>
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {points.map(p => (
                <li key={p} className="flex gap-2 items-start text-[0.85rem] text-slate-700">
                  <ShieldCheck size={15} className="text-success shrink-0 mt-0.5" />
                  {t(p)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
