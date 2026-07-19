import { HeroClient } from './HeroClient'
import type { Translate } from '../constants'

// Server wrapper: resolves the hero strings and hands them to the client hero
// (which owns the load → blur → reveal timing).
export function Hero({
  t,
  demoDashboardUrl,
  demoMenuUrl,
  demoHubUrl,
}: {
  t: Translate
  demoDashboardUrl: string
  demoMenuUrl: string | null
  demoHubUrl: string
}) {
  return (
    <HeroClient
      badge={t('lpHeroBadge')}
      title1={t('lpHeroTitle1')}
      title2={t('lpHeroTitle2')}
      subtitle={t('lpHeroSubtitle')}
      ctaLabel={t('lpHeroCta')}
      pricingLabel={t('pricingTitle')}
      demoUrl={demoDashboardUrl}
      demoMenuUrl={demoMenuUrl}
      scrollLabel={t('lpScrollDown')}
      featuresBadge={t('lpSlideFeatBadge')}
      featuresTitle={t('lpSlideFeatTitle')}
      features={[
        t('lpSlideFeat1'),
        t('lpSlideFeat2'),
        t('lpSlideFeat3'),
        t('lpSlideFeat4'),
        t('lpSlideFeat5'),
        t('lpSlideFeat6'),
      ]}
      menuBadge={t('lpMenuBadge')}
      menuTitle1={t('lpMenuTitle1')}
      menuTitle2={t('lpMenuTitle2')}
      menuSubtitle={t('lpMenuSubtitle')}
    />
  )
}
