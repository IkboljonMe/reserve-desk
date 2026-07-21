"use client";

import { Plus } from "lucide-react";
import { useTranslation } from "@/i18n";
import { useClientGroupsPage } from "./useClientGroupsPage";
import { GroupList } from "./components/GroupList";
import { GroupModal } from "./components/GroupModal";
import Button from "@/components/ui/Button";

export default function ClientGroupsPage() {
  const { t } = useTranslation();
  const s = useClientGroupsPage();

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="m-0 text-lg font-bold">{t("clientGroups")}</h2>
          <p className="mt-1 text-sm text-[--gray-500]">
            {t("clientGroupsSubtitle")}
          </p>
        </div>
        <Button onClick={s.openAdd}>
          <Plus size={14} strokeWidth={2.5} />
          {t("addGroup")}
        </Button>
      </div>

      <GroupList s={s} />
      <GroupModal s={s} />
    </div>
  );
}
