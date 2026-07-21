import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession, isCompanyExpired } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { Company } from "@/models/Company";
import { Plan } from "@/models/Plan";
import type { FeatureKey } from "@/lib/planFeatures";
import { ToastProvider } from "@/providers/ToastProvider";
import { DraftProvider } from "@/components/DraftProvider";
import { BookingModalProvider } from "@/components/BookingModalProvider";
import DashboardContainer from "@/components/layout/DashboardContainer";
import { getSubdomain } from "@/lib/subdomain";

// The OWNER area: /secure/company/{slug}/... Hotel admins live in the nested
// /admin/{hotelSlug} subtree with its own layout.
// LanguageProvider is supplied by the parent [locale] layout, so the whole app
// (including login) shares it.
// middleware.ts already blocks unauthenticated/mismatched-tenant access to this
// tree — the checks here are defense in depth in case this layout is ever
// reached directly (e.g. a future server action).
export default async function OwnerDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const session = await getSession();
  if (!session || session.role !== "owner" || session.companySlug !== slug) {
    redirect(`/${locale}/secure/company/${slug}/login`);
  }

  await connectDB();
  const company = await Company.findById(session.companyId)
    .select("expiresAt plan")
    .lean<{ expiresAt: Date; plan: string }>();
  const readOnly = !!company && isCompanyExpired(company.expiresAt);
  const planDoc = company
    ? await Plan.findOne({ key: company.plan })
        .select("features")
        .lean<{ features: FeatureKey[] }>()
    : null;
  const planFeatures = planDoc?.features;

  // Detect subdomain → clean basePath for the sidebar.
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const sub = getSubdomain(host);
  const basePath =
    sub === "app" || sub === "demo" || sub === slug
      ? ""
      : `/secure/company/${slug}`;

  return (
    <ToastProvider>
      <DraftProvider>
        <BookingModalProvider>
          <DashboardContainer
            userName={session.name}
            userEmail={session.email}
            role={session.role}
            basePath={basePath}
            hotelName=""
            readOnly={readOnly}
            planFeatures={planFeatures}
          >
            {children}
          </DashboardContainer>
        </BookingModalProvider>
      </DraftProvider>
    </ToastProvider>
  );
}
