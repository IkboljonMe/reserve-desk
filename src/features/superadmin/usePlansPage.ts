"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/providers/ToastProvider";
import { useTranslation } from "@/i18n";
import {
  getPlans,
  savePlan,
  deletePlan,
  type PlanRecord,
} from "@/lib/api/plans";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const EMPTY_FORM = {
  key: "",
  name: "",
  price: 0,
};

export function usePlansPage() {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<PlanRecord | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [keyTouched, setKeyTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setPlans(await getPlans());
    } catch {
      showToast(t("loadPlansFailed"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadData();
  }, [loadData]);

  function openAdd() {
    setEditPlan(null);
    setKeyTouched(false);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(p: PlanRecord) {
    setEditPlan(p);
    setKeyTouched(true);
    setForm({ key: p.key, name: p.name, price: p.price });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditPlan(null);
    setForm(EMPTY_FORM);
  }

  function setName(name: string) {
    setForm((f) => ({ ...f, name, key: keyTouched ? f.key : slugify(name) }));
  }

  function setKey(key: string) {
    setKeyTouched(true);
    setForm((f) => ({ ...f, key: slugify(key) }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.key.trim()) return;
    setSaving(true);
    try {
      await savePlan(
        {
          name: form.name.trim(),
          price: form.price,
          ...(editPlan ? {} : { key: form.key.trim() }),
        },
        editPlan?._id,
      );
      showToast(editPlan ? t("planUpdated") : t("planAdded"), "success");
      closeModal();
      loadData();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("savePlanFailed"),
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deletePlan(id);
      showToast(t("planDeleted"), "success");
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("deleteFailed"),
        "error",
      );
    }
  }

  return {
    plans,
    loading,
    modalOpen,
    editPlan,
    form,
    setForm,
    setName,
    setKey,
    saving,
    deleteConfirm,
    setDeleteConfirm,
    openAdd,
    openEdit,
    closeModal,
    handleSave,
    handleDelete,
  };
}

export type PlansPageState = ReturnType<typeof usePlansPage>;
