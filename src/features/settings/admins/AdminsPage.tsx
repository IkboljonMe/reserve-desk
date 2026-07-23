"use client";

import { Plus } from "lucide-react";
import { useTranslation } from "@/i18n";
import { useAdminsPage } from "./useAdminsPage";
import { AdminList } from "./components/AdminList";
import { AdminModal } from "./components/AdminModal";
import Button from "@/components/ui/Button";

export default function AdminsPage() {
  const { t } = useTranslation();
  const s = useAdminsPage();

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="m-0 text-lg font-bold">{t("admins")}</h2>
          <p className="mt-1 text-sm text-(--gray-500)">
            {t("adminsSubtitle")}
          </p>
        </div>
        <Button
          onClick={s.openAdd}
          disabled={s.noHotels}
          title={s.noHotels ? t("addHotelFirst") : undefined}
        >
          <Plus size={14} strokeWidth={2.5} />
          {t("addAdmin")}
        </Button>
      </div>

      <AdminList s={s} />
      <AdminModal s={s} />
    </div>
  );
}
