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
        /* The hero photo is desktop-only — too heavy/distracting on small
           screens. Fall back to a soft gradient so the section isn't blank. */
        .lp-hero-fs-bg { display: none; }
        .lp-hero-fs {
          background: linear-gradient(180deg, #eef1fb, #f8fafc);
          /* Without the photo, a full-viewport centered layout leaves huge
             empty gaps above/below the copy — size to content instead. */
          height: auto; min-height: 0; padding: 50px 0;
        }
        .lp-hero-fs-scroll { display: none; }
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

      /* Full-screen hero: the banner loads sharp, then after ~2.5s it blurs while
         the copy fades in (.is-revealed, toggled in HeroClient). */
      .lp-hero-fs { position: relative; height: 100dvh; min-height: 560px; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; overflow: hidden; }
      .lp-hero-fs-bg { position: absolute; inset: 0; z-index: 0; }
      .lp-hero-fs-img { transition: filter 1.4s ease, transform 1.4s ease; }
      .lp-hero-fs.is-revealed .lp-hero-fs-img { filter: blur(5px); transform: scale(1.04); }
      .lp-hero-fs-veil { position: absolute; inset: 0; z-index: 1; background: radial-gradient(ellipse 72% 56% at 50% 50%, rgba(248,250,252,0.74), rgba(248,250,252,0.32)); opacity: 0; transition: opacity 1.4s ease; }
      .lp-hero-fs.is-revealed .lp-hero-fs-veil { opacity: 1; }
      .lp-hero-fs-content { position: relative; z-index: 2; max-width: 820px; padding: 0 1.5rem; opacity: 0; transform: translateY(28px); transition: opacity 1s ease 0.2s, transform 1s ease 0.2s; }
      .lp-hero-fs.is-revealed .lp-hero-fs-content { opacity: 1; transform: none; }
      .lp-hero-fs-badge { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 22px; padding: 6px 14px; border-radius: 999px; background: rgba(79,110,247,0.1); border: 1px solid rgba(79,110,247,0.2); color: #3b5bdb; font-size: 0.8rem; font-weight: 600; }
      .lp-hero-fs-title { font-size: clamp(2rem, 5.5vw, 3.6rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.08; margin: 0 0 1.1rem; color: #0f172a; }
      .lp-hero-fs-sub { font-size: clamp(1rem, 2vw, 1.2rem); color: #475569; line-height: 1.6; margin: 0 auto 2rem; max-width: 640px; }
      .lp-hero-fs-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
      .lp-hero-fs-cta-primary { padding: 14px 30px; border-radius: 12px; text-decoration: none; background: linear-gradient(135deg, #4f6ef7, #3b5bdb); color: #fff; font-weight: 700; box-shadow: 0 8px 24px rgba(79,110,247,0.35); display: inline-flex; align-items: center; gap: 8px; }
      .lp-hero-fs-cta-secondary { padding: 14px 30px; border-radius: 12px; text-decoration: none; background: rgba(255,255,255,0.9); color: #0f172a; border: 1px solid #e2e8f0; font-weight: 600; display: inline-flex; align-items: center; }
      .lp-hero-fs-scroll { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 2; margin: 0; opacity: 0; transition: opacity 1s ease 0.6s; }
      .lp-hero-fs.is-revealed .lp-hero-fs-scroll { opacity: 1; }
      .lp-hero-overlay-accent { background: linear-gradient(135deg, #4f6ef7, #7c3aed); -webkit-background-clip: text; background-clip: text; color: transparent; }

      /* Normal scroll. */
      .lp-content-over { position: relative; background: #f8fafc; }
      html { scrollbar-width: none; }
      html::-webkit-scrollbar { width: 0; height: 0; display: none; }

      /* Call-back contact widget — a floating button that opens the form. */
      .lp-contact-fab { position: fixed; right: 20px; bottom: 20px; z-index: 1200; width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer; background: linear-gradient(135deg, #4f6ef7, #3b5bdb); color: #fff; box-shadow: 0 12px 30px rgba(79,110,247,0.42); display: inline-flex; align-items: center; justify-content: center; transition: transform 0.2s ease, box-shadow 0.2s ease; }
      .lp-contact-fab:hover { transform: translateY(-2px) scale(1.06); box-shadow: 0 16px 36px rgba(79,110,247,0.5); }
      .lp-contact { position: fixed; right: 20px; bottom: 20px; z-index: 1200; width: min(340px, calc(100vw - 32px)); background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 20px 50px rgba(15,23,42,0.22); padding: 18px 18px 16px; animation: lpContactIn 0.35s cubic-bezier(0.16,1,0.3,1); }
      @keyframes lpContactIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
      .lp-contact-close { position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; border: none; background: #f1f5f9; border-radius: 8px; color: #64748b; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
      .lp-contact-head { display: flex; align-items: center; gap: 8px; font-size: 0.98rem; color: #0f172a; }
      .lp-contact-icon { display: inline-flex; width: 28px; height: 28px; border-radius: 8px; align-items: center; justify-content: center; background: rgba(79,110,247,0.1); color: #4f6ef7; }
      .lp-contact-desc { margin: 8px 0 12px; font-size: 0.82rem; color: #64748b; line-height: 1.5; }
      .lp-contact-input { width: 100%; box-sizing: border-box; padding: 10px 12px; margin-bottom: 8px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.875rem; outline: none; }
      .lp-contact-input:focus { border-color: #4f6ef7; box-shadow: 0 0 0 3px rgba(79,110,247,0.14); }
      .lp-contact-err { font-size: 0.75rem; color: #dc2626; margin-bottom: 8px; }
      .lp-contact-submit { width: 100%; padding: 11px; border: none; border-radius: 10px; background: linear-gradient(135deg, #4f6ef7, #3b5bdb); color: #fff; font-weight: 700; font-size: 0.9rem; cursor: pointer; }
      .lp-contact-submit:disabled { opacity: 0.6; cursor: default; }
      .lp-contact-success { padding: 12px 4px; text-align: center; font-size: 0.9rem; font-weight: 600; color: #0f172a; }
      @media (max-width: 640px) {
        .lp-mock-sidebar { display: none !important; }
      }
      @media (prefers-reduced-motion: reduce) { .lp-blob-1, .lp-blob-2 { animation: none; } }
    `}} />
  )
}

