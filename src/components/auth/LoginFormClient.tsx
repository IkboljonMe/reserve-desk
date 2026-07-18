"use client";

import { useState } from "react";

import { useTranslation } from "@/i18n";
import { getClientSubdomain } from "@/lib/subdomain";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";

// `initialEmail` prefills the field when a login link supplies it (e.g. the
// superadmin "open login" shortcut passes ?email=). The password is never
// prefilled. Passed from the server page so we avoid useSearchParams (which
// would force a Suspense boundary / dynamic rendering on the login pages).
export default function LoginFormClient({ initialEmail = "" }: { initialEmail?: string }) {
  const { t, lang } = useTranslation();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("loginFailed"));
      } else {
        // Full, subdomain-independent paths — `/dashboard`/`/calendar` alone
        // only resolve via the proxy's subdomain rewrite (app./admin./super.),
        // so on the plain root domain (e.g. local dev) they 404.
        if (data.role === "superadmin") {
          // On super.bronit.uz the proxy serves the tree at clean paths.
          window.location.href = getClientSubdomain() === "super"
            ? `/${lang}/dashboard`
            : `/${lang}/secure/superadmin/dashboard`;
        } else if (data.role === "owner") {
          window.location.href = `/${lang}/secure/company/${data.slug}/dashboard`;
        } else {
          window.location.href = `/${lang}/secure/company/${data.slug}/admin/${data.hotelSlug}/calendar`;
        }
      }
    } catch {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[0.8125rem] font-semibold text-white/70 tracking-tight">
          {t("emailAddress")}
        </label>
        <input
          id="email"
          type="email"
          className="w-full px-3 py-2 min-h-9.5 rounded-lg text-sm outline-none transition-all duration-150 bg-white/7 border-1.5 border-white/12 text-white placeholder-white/30 focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
          placeholder="example@bronit.uz"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[0.8125rem] font-semibold text-white/70 tracking-tight">
          {t("password")}
        </label>
        <input
          id="password"
          type="password"
          className="w-full px-3 py-2 min-h-9.5 rounded-lg text-sm outline-none transition-all duration-150 bg-white/7 border-1.5 border-white/12 text-white placeholder-white/30 focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && (
        <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-[8px_12px] text-[#fca5a5] text-sm">
          {error}
        </div>
      )}

      <Button
        id="login-submit"
        type="submit"
        disabled={loading}
        size="lg"
        className="mt-1 w-full"
      >
        {loading ? <Spinner size={18} dark={false} /> : null}
        {loading ? t("signingIn") : t("signIn")}
      </Button>
    </form>
  );
}
