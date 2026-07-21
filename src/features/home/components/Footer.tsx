import Link from "next/link";
import type { Translate } from "../constants";

export function Footer({
  t,
  demoUrl,
  loginHref,
}: {
  t: Translate;
  demoUrl: string;
  loginHref: string;
}) {
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-285 mx-auto px-6 py-8 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-slate-500 text-[0.83rem]">
          © {new Date().getFullYear()} Bronit · bronit.uz
        </div>
        <div className="flex gap-4.5">
          <a
            href={demoUrl}
            className="text-slate-500 text-[0.83rem] no-underline"
          >
            {t("viewDemo")}
          </a>
          <a
            href="#pricing"
            className="text-slate-500 text-[0.83rem] no-underline"
          >
            {t("pricingTitle")}
          </a>
          <Link
            href={loginHref}
            className="text-slate-500 text-[0.83rem] no-underline"
          >
            {t("signIn")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
