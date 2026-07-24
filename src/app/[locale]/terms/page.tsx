import type { Metadata } from "next";
import { LegalPage } from "@/features/legal/LegalPage";
import { getLegal } from "@/features/legal/legalContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: getLegal("terms", locale).title };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <LegalPage doc="terms" locale={locale} />;
}
