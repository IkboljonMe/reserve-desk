// Global-ish CSS for the landing page: things inline styles can't express
// (@media, :hover, keyframes, scroll-behavior). Scoped by the `lp-`/`uno-`
// class prefixes used across the sections.
export function LandingStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      html { scroll-behavior: smooth; }
      /* Offset anchor targets so the sticky header doesn't cover them. */
      #features, #reviews, #pricing, #faq { scroll-margin-top: 76px; }
      @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
      .lp-nav-links { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
      .lp-nav-desktop-cta { display: flex; gap: 8px; align-items: center; }
      .lp-mobile-menu-btn { display: none; }
      @media (max-width: 720px) {
        /* Swap the desktop anchor nav + inline CTAs for a hamburger drawer;
           the language dropdown stays on the navbar. */
        .lp-nav-links, .lp-nav-desktop-cta { display: none; }
        .lp-mobile-menu-btn { display: inline-flex; }
      }
      @media (max-width: 640px) {
        .lp-final-cta { padding: 2.25rem 1.35rem !important; }
      }
      @media (max-width: 420px) {
        /* Tighter gutters and roomier tap targets on very small phones. */
        .lp-pad-x { padding-left: 1.15rem !important; padding-right: 1.15rem !important; }
        .lp-cta-full { flex: 1 1 100%; justify-content: center; }
      }

      /* Hero liquid-gradient blobs (one follows the mouse — see HeroBackground) */
      .lp-blob { position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.65; will-change: transform; pointer-events: none; }
      .lp-blob-1 { width: 45vw; max-width: 540px; aspect-ratio: 1 / 1; left: 4%; top: -12%; background: radial-gradient(circle, rgba(79,110,247,0.32), transparent 65%); animation: lpFloat1 15s ease-in-out infinite; }
      .lp-blob-2 { width: 40vw; max-width: 500px; aspect-ratio: 1 / 1; right: 2%; top: -18%; background: radial-gradient(circle, rgba(124,58,237,0.28), transparent 65%); animation: lpFloat2 19s ease-in-out infinite; }
      .lp-blob-follow { width: 38vw; max-width: 480px; aspect-ratio: 1 / 1; left: 0; top: 0; background: radial-gradient(circle, rgba(79,110,247,0.3) 0%, rgba(124,58,237,0.18) 45%, rgba(34,211,238,0.08) 70%, transparent 80%); transform: translate3d(58vw, 130px, 0) translate(-50%, -50%); transition: opacity 0.3s ease; }
      @keyframes lpFloat1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(5%,7%) scale(1.08); } }
      @keyframes lpFloat2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-6%,5%) scale(1.1); } }

      /* Scroll down animation style */
      .lp-scroll-down {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        margin-top: 36px;
        color: #94a3b8;
        text-decoration: none;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        transition: color 0.3s ease;
      }
      .lp-scroll-down:hover {
        color: #4f6ef7;
      }
      .lp-scroll-indicator {
        width: 20px;
        height: 32px;
        border: 2px solid currentColor;
        border-radius: 12px;
        position: relative;
        opacity: 0.8;
      }
      .lp-scroll-dot {
        width: 4px;
        height: 6px;
        background: currentColor;
        border-radius: 2px;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        top: 6px;
        animation: lpScrollWheel 1.6s ease-in-out infinite;
      }
      @keyframes lpScrollWheel {
        0% { opacity: 0; transform: translate(-50%, 0); }
        30% { opacity: 1; }
        80% { opacity: 0; transform: translate(-50%, 8px); }
        100% { opacity: 0; }
      }

      /* Premium styles for dashboard mockup and CTA buttons */
      .lp-btn-primary { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      .lp-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(79,110,247,0.45) !important; }
      .lp-btn-secondary { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      .lp-btn-secondary:hover { background: #fff !important; border-color: #cbd5e1 !important; transform: translateY(-2px); }
      .lp-mockup-wrapper { transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
      .lp-mockup-wrapper:hover { transform: translateY(-4px) scale(1.005); box-shadow: 0 42px 80px rgba(15,23,42,0.12), 0 0 0 1px rgba(79,110,247,0.1) !important; }
      @media (max-width: 640px) {
        .lp-mock-sidebar { display: none !important; }
      }
      @media (prefers-reduced-motion: reduce) { .lp-blob-1, .lp-blob-2 { animation: none; } }
    `}} />
  )
}

