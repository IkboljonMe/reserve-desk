import { HeroClient } from './HeroClient'
import type { Translate } from '../constants'

// Server wrapper: resolves the hero strings and hands them to the client hero
// (which owns the load → blur → reveal timing).
export function Hero({ t, demoUrl }: { t: Translate; demoUrl: string }) {
  return (
    <HeroClient
      badge={t('lpHeroBadge')}
      title1={t('lpHeroTitle1')}
      title2={t('lpHeroTitle2')}
      subtitle={t('lpHeroSubtitle')}
      ctaLabel={t('lpHeroCta')}
      pricingLabel={t('pricingTitle')}
      demoUrl={demoUrl}
      scrollLabel={t('lpScrollDown')}
    />
  )
}
