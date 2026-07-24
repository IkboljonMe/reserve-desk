"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "@/i18n";
import { useIsMobile } from "@/hooks/useIsMobile";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { ContractsFilterControls } from "./ContractsFilterControls";
import type { ContractsPageState } from "../useContractsPage";

export function ContractsFilters({ s }: { s: ContractsPageState }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // Mobile: a single Filters button opening a full-screen modal with all the
  // filter controls (matching the calendar page).
  if (isMobile) {
    return (
      <>
        <Button
          variant="secondary"
          className="w-full justify-center mb-4"
          leftIcon={<SlidersHorizontal size={15} />}
          onClick={() => setOpen(true)}
        >
          {t("filters")}
          {s.activeFilterCount > 0 ? ` (${s.activeFilterCount})` : ""}
        </Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title={t("filters")}
          size="sm"
          closeLabel={t("close")}
          footer={
            <Button
              variant="primary"
              className="w-full justify-center"
              onClick={() => setOpen(false)}
            >
              {t("close")}
            </Button>
          }
        >
          <ContractsFilterControls s={s} stack />
        </Modal>
      </>
    );
  }

  // Desktop: inline filter row — search + dropdowns each as their own field
  // (no enclosing card, so they read as separate controls).
  return (
    <div className="mb-4">
      <ContractsFilterControls s={s} />
    </div>
  );
}
