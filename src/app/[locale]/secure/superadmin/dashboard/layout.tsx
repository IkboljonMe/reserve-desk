import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { Company } from "@/models/Company";
import { getSubdomain } from "@/lib/subdomain";
import { DEMO_SLUG } from "@/features/demo/config";
import { ToastProvider } from "@/providers/ToastProvider";
import LogoutButton from "./LogoutButton";
import MyAccountButton from "./MyAccountButton";
import SuperadminNav from "./SuperadminNav";

const EXPIRING_SOON_DAYS = 14;

// Kept as its own function (not inlined at the call site) so the impure
// `Date.now()` read doesn't happen directly in the component body.
function soonCutoff(): Date {
  return new Date(Date.now() + EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000);
}

// proxy.ts already gates this tree to superadmin sessions — this check is
// defense in depth in case the layout is ever reached directly.
export default async function SuperadminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session || session.role !== "superadmin") {
    redirect(`/${locale}/secure/superadmin/login`);
  }

  await connectDB();
  const notifCount = await Company.countDocuments({
    slug: { $ne: DEMO_SLUG },
    expiresAt: { $lte: soonCutoff() },
  });

  // On the `super.` subdomain the proxy serves the superadmin tree at clean
  // paths (super.bronit.uz/<locale>/dashboard/…), so drop the /secure/superadmin
  // prefix from nav links there. On the root domain the full path is needed.
  const host = (await headers()).get("host") || "";
  const onSuperSubdomain = getSubdomain(host) === "super";
  const navBase = onSuperSubdomain
    ? `/${locale}/dashboard`
    : `/${locale}/secure/superadmin/dashboard`;

  return (
    <ToastProvider>
      <div className="sa-light min-h-dvh bg-(--surface-card)">
        <div className="flex items-center justify-between py-4 px-6 border-b border-(--surface-border) bg-[#14192a]">
          <div className="text-white font-extrabold tracking-[-0.01em]">
            Bronit — Superadmin
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-[0.8125rem]">
              {session.name}
            </span>
            <MyAccountButton initialEmail={session.email} />
            <LogoutButton />
          </div>
        </div>
        <SuperadminNav basePath={navBase} notifCount={notifCount} />
        <main className="py-7 px-8 max-w-240 mx-auto">{children}</main>
      </div>
    </ToastProvider>
  );
}
