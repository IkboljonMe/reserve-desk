import { FAQS, SECTION_TITLE, SECTION_SUB, type Translate } from '../constants'
import { JsonLd } from '@/components/JsonLd'
import { FaqItem } from './FaqItem'

export function Faq({ t }: { t: Translate }) {
  // FAQPage structured data — makes the Q&As eligible for FAQ rich results.
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(({ q, a }) => ({
      '@type': 'Question',
      name: t(q),
      acceptedAnswer: { '@type': 'Answer', text: t(a) },
    })),
  }

  return (
    <section id="faq" className="max-w-[1200px] mx-auto px-5 lg:px-10 py-14">
      <JsonLd data={faqLd} />
      <h2 className={SECTION_TITLE}>FAQ</h2>
      <p className={SECTION_SUB}>{t('lpFaqSub')}</p>
      <div className="flex flex-col gap-3">
        {FAQS.map(({ q, a }) => (
          <FaqItem key={q} q={t(q)} a={t(a)} />
        ))}
      </div>
    </section>
  )
}
