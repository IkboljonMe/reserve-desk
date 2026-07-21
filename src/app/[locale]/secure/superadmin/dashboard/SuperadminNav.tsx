"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n";

export default function SuperadminNav({
  basePath,
  notifCount,
}: {
  basePath: string;
  notifCount: number;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const tabs = [
    { href: basePath, label: t("companies") },
    { href: `${basePath}/plans`, label: t("plans") },
    {
      href: `${basePath}/notifications`,
      label: t("notifications"),
      badge: notifCount,
    },
  ];

  return (
    <div className="flex gap-1 px-6 bg-[#14192a] border-b border-white/10">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex items-center gap-1.5 px-[0.9rem] py-[0.7rem] text-[0.8125rem] font-semibold border-b-2 ${
              active
                ? "text-white border-(--brand-500,#6366f1)"
                : "text-white/55 border-transparent"
            }`}
          >
            {tab.label}
            {!!tab.badge && (
              <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1.25 rounded-full bg-red-500 text-white text-[0.6875rem] font-bold">
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
