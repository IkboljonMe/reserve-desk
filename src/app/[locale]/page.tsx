import { LOCALES } from "@/i18n/config";
import { HomePage } from "@/features/home/HomePage";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <HomePage locale={locale} />;
}
