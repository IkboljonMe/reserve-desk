"use client";

import { Plus } from "lucide-react";
import { useTranslation } from "@/i18n";
import { useServicesPage } from "./useServicesPage";
import { ServicesFilterBar } from "./components/ServicesFilterBar";
import { ServicesGrid } from "./components/ServicesGrid";
import { ServiceFormModal } from "./components/ServiceFormModal";
import Button from "@/components/ui/Button";

export default function ServicesPage() {
  const { t } = useTranslation();
  const s = useServicesPage();

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
        <div>
          <h2 className="flex items-center gap-2 m-0 text-lg font-bold">
            {t("services")}
            {!s.loading && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[0.7rem] bg-[var(--brand-50,#eef2ff)] text-[var(--brand-700,#4338ca)] border border-[var(--brand-100,#e0e7ff)] ml-1">
                {t("activeCount", { count: s.activeCount })}
              </span>
            )}
          </h2>
          <p className="text-[0.8125rem] text-[--gray-500] mt-0.5">
            {t("servicesSubtitle")}
          </p>
        </div>
        <Button id="add-service-btn" onClick={s.openAddForm}>
          <Plus size={15} strokeWidth={2.5} />
          {t("addService")}
        </Button>
      </div>

      {/* ── Filter Bar ── */}
      {!s.loading && s.services.length > 0 && <ServicesFilterBar s={s} />}

      {/* ── Content ── */}
      <ServicesGrid s={s} />

      {/* ── Modal Form ── */}
      <ServiceFormModal s={s} />
    </div>
  );
}
