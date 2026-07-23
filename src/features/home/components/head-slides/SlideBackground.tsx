const BANNER = '/sliders/bronit-main/bronit'

/**
 * Shared blurred hero background — art-directed crops (portrait on mobile,
 * ultra-wide on desktop) served as WebP with a JPG fallback. Used by every
 * slide in the hero carousel so they share one visual bed.
 *
 * `eager` marks the first (above-the-fold) slide so its image is fetched with
 * high priority; later slides load lazily.
 */
export function SlideBackground({ eager = false }: { eager?: boolean }) {
  return (
    <div className="absolute inset-0 z-0">
      <picture>
        {/* Desktop wide (1280×397) */}
        <source media="(min-width: 1024px)" type="image/webp" srcSet={`${BANNER}__xl.webp`} />
        <source media="(min-width: 1024px)" srcSet={`${BANNER}__xl.jpg`} />
        {/* Tablet (1280×654) */}
        <source media="(min-width: 640px)" type="image/webp" srcSet={`${BANNER}__sm.webp`} />
        <source media="(min-width: 640px)" srcSet={`${BANNER}__sm.jpg`} />
        {/* Mobile (1184×1280) — default */}
        <source type="image/webp" srcSet={`${BANNER}__xs.webp`} />
        <img
          src={`${BANNER}__xs.jpg`}
          alt=""
          aria-hidden="true"
          fetchPriority={eager ? 'high' : 'auto'}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="w-full h-full object-cover blur-sm scale-[1.03]"
        />
      </picture>
      {/* Soft dark overlay to enhance text contrast and make whites pop */}
      <div className="absolute inset-0 bg-slate-950/45" />
    </div>
  )
}
