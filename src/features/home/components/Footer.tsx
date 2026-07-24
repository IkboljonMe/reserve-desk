import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import type { Translate } from "../constants";

// Public brand profiles — also mirrored into the Organization schema's `sameAs`.
export const TELEGRAM_URL = "https://t.me/bronituz";
export const INSTAGRAM_URL = "https://www.instagram.com/bronituz";

const linkCls =
  "text-slate-500 text-[0.85rem] no-underline hover:text-slate-900 transition-colors";
const socialCls =
  "w-9 h-9 inline-flex items-center justify-center border border-slate-200 bg-white text-slate-500 hover:text-brand-500 hover:border-brand-200 transition-colors";
const colTitleCls =
  "text-slate-900 text-[0.72rem] font-bold uppercase tracking-[0.08em] mb-3";

export function Footer({
  t,
  lang,
  demoUrl,
  loginHref,
}: {
  t: Translate;
  lang: string;
  demoUrl: string;
  loginHref: string;
}) {
  return (
    <footer className="w-full bg-slate-50 border-t border-slate-200">
      <div className="max-w-300 mx-auto px-6 py-12">
        <div className="grid gap-8 md:gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <BrandMark size={34} />
              <span className="text-slate-900 text-[1.2rem] font-extrabold tracking-tight">
                Bronit
              </span>
            </div>
            <p className="text-slate-500 text-[0.85rem] leading-relaxed max-w-72">
              {t("footerTagline")}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className={colTitleCls}>{t("footerProduct")}</h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
              <li>
                <a href={demoUrl} className={linkCls}>
                  {t("viewDemo")}
                </a>
              </li>
              <li>
                <a href="#pricing" className={linkCls}>
                  {t("lpPricingTitle")}
                </a>
              </li>
              <li>
                <Link href={loginHref} className={linkCls}>
                  {t("signIn")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className={colTitleCls}>{t("footerLegal")}</h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
              <li>
                <Link href={`/${lang}/privacy`} className={linkCls}>
                  {t("privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/terms`} className={linkCls}>
                  {t("termsOfUse")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className={colTitleCls}>{t("footerFollow")}</h4>
            <div className="flex items-center gap-2">
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Bronit on Telegram"
                className={socialCls}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M21.94 4.9 18.7 19.2c-.24 1.08-.9 1.34-1.82.84l-5.02-3.7-2.42 2.33c-.27.27-.5.5-1 .5l.36-5.1L18 5.6c.4-.36-.08-.56-.62-.2L6.9 12.2l-4.86-1.52c-1.06-.33-1.08-1.06.22-1.57L20.57 3.4c.88-.33 1.65.2 1.37 1.5Z" />
                </svg>
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Bronit on Instagram"
                className={socialCls}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-200 mt-10 pt-6 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-slate-500 text-[0.82rem]">
            © {new Date().getFullYear()} Bronit · bronit.uz
          </div>
          <div className="text-slate-400 text-[0.82rem]">
            {t("footerRights")}
          </div>
        </div>
      </div>
    </footer>
  );
}
