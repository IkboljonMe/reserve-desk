import LoginFormClient from "@/components/auth/LoginFormClient";
import { BrandMark } from "@/components/BrandMark";
import { getT } from "@/i18n/dictionary";
import { headers } from "next/headers";
import { getSubdomain } from "@/lib/subdomain";

// On the root domain this shows selecting the owner/admin portal,
// while on correct subdomains it displays the real login form.
export default async function UniversalLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { locale } = await params;
  const { email } = await searchParams;
  const t = getT(locale);
  const reqHeaders = await headers();
  const host = reqHeaders.get("host") || "";
  const sub = getSubdomain(host);

  const protocol =
    reqHeaders.get("x-forwarded-proto") ||
    (host.includes("localhost") || host.includes(".test") ? "http" : "https");
  const baseDomain = host.replace(/^(www|app|admin|super|demo)\./, "");
  // Marketing site lives on the root domain — link back to it from any portal.
  const homeUrl = `${protocol}://${baseDomain}/${locale}`;

  return (
    <main className="min-h-dvh flex items-center justify-center bg-[radial-gradient(900px_500px_at_80%_-10%,rgba(124,58,237,0.35),transparent_60%),radial-gradient(800px_500px_at_10%_110%,rgba(79,110,247,0.30),transparent_55%),linear-gradient(135deg,#14192a_0%,#1e2540_50%,#14192a_100%)]">
      <div className="w-full max-w-100 p-4">
        <div className="text-center mb-8">
          <a
            href={homeUrl}
            className="no-underline inline-block"
            aria-label={t("backToHome")}
          >
            <BrandMark size={64} priority className="mx-auto mb-3" />
            <h1 className="text-white text-[1.6rem] font-extrabold tracking-tight mb-1">
              Bronit
            </h1>
          </a>
          <p className="text-white/50 text-sm">{t("universalLoginHint")}</p>
        </div>

        <div className="bg-white/6 backdrop-blur-2xl border border-white/12 rounded-xl p-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          {!sub ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-white text-[1.25rem] font-semibold text-center mb-4">
                Select your portal
              </h2>
              <a
                href={`${protocol}://app.${baseDomain}/${locale}/login`}
                className="inline-flex items-center justify-center gap-1.5 font-semibold whitespace-nowrap tracking-tight bg-(image:--brand-gradient) shadow-brand transition-all duration-150 hover:brightness-[1.06] hover:shadow-[0_8px_20px_rgba(79,110,247,0.36)] active:translate-y-px text-center p-4 rounded-xl text-white no-underline"
              >
                Owner Portal
              </a>
              <a
                href={`${protocol}://admin.${baseDomain}/${locale}/login`}
                className="inline-flex items-center justify-center gap-1.5 font-semibold whitespace-nowrap tracking-tight border border-white/20 transition-colors duration-150 hover:bg-white/15 text-center p-4 rounded-xl bg-white/10 text-white no-underline"
              >
                Branch Admin Portal
              </a>
              <a
                href={`${protocol}://super.${baseDomain}/${locale}/login`}
                className="text-center p-2 text-white/50 text-sm mt-4 no-underline hover:text-white/80 transition-colors"
              >
                Superadmin Login
              </a>
            </div>
          ) : (
            <>
              <h2 className="text-white text-[1.125rem] font-semibold mb-6">
                {t("signInToAccount")}
              </h2>
              <LoginFormClient
                initialEmail={typeof email === "string" ? email : ""}
              />
            </>
          )}
        </div>

        <div className="text-center mt-6">
          <a
            href={homeUrl}
            className="text-white/55 text-[0.85rem] no-underline hover:text-white/80 transition-colors"
          >
            ← {t("backToHome")}
          </a>
        </div>
      </div>
    </main>
  );
}
