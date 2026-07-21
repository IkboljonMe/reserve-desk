"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";
import { getClientSubdomain } from "@/lib/subdomain";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";

export default function LogoutButton() {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(
      getClientSubdomain() === "super"
        ? `/${lang}/login`
        : `/${lang}/secure/superadmin/login`,
    );
    router.refresh();
  }

  return (
    <Button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      size="sm"
      className="bg-white/10 text-white border border-white/15"
    >
      {loggingOut ? <Spinner size={18} dark={false} /> : t("signOut")}
    </Button>
  );
}
