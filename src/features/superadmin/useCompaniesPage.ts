"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/providers/ToastProvider";
import { useTranslation } from "@/i18n";
import {
  getCompanies,
  saveCompany,
  deleteCompany,
  type CompanyRecord,
  type CompanyPlan,
} from "@/lib/api/companies";
import { getPlans, type PlanRecord } from "@/lib/api/plans";
import { toBronitEmail } from "@/lib/bronitEmail";

function defaultExpiry() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

// The slug is derived from the name server-side (no longer entered here).
export const EMPTY_FORM = {
  name: "",
  plan: "standard" as CompanyPlan,
  expiresAt: defaultExpiry(),
  fullName: "",
  paymentMethod: "",
  note: "",
  ownerEmail: "",
  ownerPassword: "",
};

export function useCompaniesPage() {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<CompanyRecord | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [accountsCompany, setAccountsCompany] = useState<CompanyRecord | null>(
    null,
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [companyList, planList] = await Promise.all([
        getCompanies(),
        getPlans(),
      ]);
      setCompanies(companyList);
      setPlans(planList);
    } catch {
      showToast(t("loadCompaniesFailed"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadData();
  }, [loadData]);

  function openAdd() {
    setEditCompany(null);
    setForm({ ...EMPTY_FORM, plan: plans[0]?.key ?? EMPTY_FORM.plan });
    setModalOpen(true);
  }

  function openEdit(c: CompanyRecord) {
    setEditCompany(c);
    setForm({
      ...EMPTY_FORM,
      name: c.name,
      plan: c.plan,
      expiresAt: c.expiresAt.slice(0, 10),
      fullName: c.contactName,
      paymentMethod: c.paymentMethod,
      note: c.note ?? "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditCompany(null);
    setForm(EMPTY_FORM);
  }

  function setName(name: string) {
    setForm((f) => ({ ...f, name }));
  }

  function setOwnerEmailLocalPart(localPart: string) {
    setForm((f) => ({ ...f, ownerEmail: toBronitEmail(localPart) }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.expiresAt || !form.fullName.trim()) return;
    if (!editCompany && (!form.ownerEmail.trim() || !form.ownerPassword))
      return;
    setSaving(true);
    try {
      await saveCompany(
        {
          name: form.name.trim(),
          plan: form.plan,
          expiresAt: form.expiresAt,
          fullName: form.fullName.trim(),
          paymentMethod: form.paymentMethod.trim(),
          note: form.note.trim(),
          ...(editCompany
            ? {}
            : {
                ownerEmail: form.ownerEmail.trim(),
                ownerPassword: form.ownerPassword,
              }),
        },
        editCompany?._id,
      );
      showToast(
        editCompany ? t("companyUpdated") : t("companyAdded"),
        "success",
      );
      closeModal();
      loadData();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("saveCompanyFailed"),
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCompany(id);
      showToast(t("companyDeleted"), "success");
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
    companies,
    plans,
    loading,
    modalOpen,
    editCompany,
    form,
    setForm,
    setName,
    setOwnerEmailLocalPart,
    saving,
    deleteConfirm,
    setDeleteConfirm,
    openAdd,
    openEdit,
    closeModal,
    handleSave,
    handleDelete,
    accountsCompany,
    openAccounts: setAccountsCompany,
    closeAccounts: () => setAccountsCompany(null),
  };
}

export type CompaniesPageState = ReturnType<typeof useCompaniesPage>;
