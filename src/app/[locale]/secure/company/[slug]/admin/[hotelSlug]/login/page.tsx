import LoginFormClient from "@/components/auth/LoginFormClient";
import { BrandMark } from "@/components/BrandMark";
import { getT } from "@/i18n/dictionary";

// Hotel-admin login: validates the account against BOTH the company slug and
// this hotel's slug (see /api/auth/login).
export default async function HotelAdminLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string; hotelSlug: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { locale, hotelSlug } = await params;
  const { email } = await searchParams;
  const t = getT(locale);
  return (
    <main className="min-h-dvh flex items-center justify-center bg-[radial-gradient(900px_500px_at_80%_-10%,rgba(124,58,237,0.35),transparent_60%),radial-gradient(800px_500px_at_10%_110%,rgba(79,110,247,0.30),transparent_55%),linear-gradient(135deg,#14192a_0%,#1e2540_50%,#14192a_100%)]">
      <div className="w-full max-w-100 p-4">
        <div className="text-center mb-8">
          <BrandMark size={64} priority className="mx-auto mb-3" />
          <h1 className="text-white text-[1.6rem] font-extrabold tracking-tight mb-1">
            Bronit
          </h1>
          <p className="text-white/50 text-sm">
            {t("hotelAdmin")} · {hotelSlug}
          </p>
        </div>

        <div className="bg-white/6 backdrop-blur-2xl border border-white/12 rounded-xl p-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          <h2 className="text-white text-[1.125rem] font-semibold mb-6">
            {t("signInToAccount")}
          </h2>
          <LoginFormClient
            initialEmail={typeof email === "string" ? email : ""}
          />
        </div>
      </div>
    </main>
  );
}
