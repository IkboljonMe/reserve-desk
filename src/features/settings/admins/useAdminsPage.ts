"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/providers/ToastProvider";
import { useTranslation } from "@/i18n";
import {
  getAdmins,
  saveAdmin,
  deleteAdmin,
  type AdminRecord,
} from "@/lib/api/admins";
import { getHotels } from "@/lib/api/hotels";
import { toBronitEmail } from "@/lib/bronitEmail";

export interface Hotel {
  _id: string;
  name: string;
  shortName: string;
}

export const EMPTY_FORM = { name: "", email: "", password: "", hotelId: "" };

export function useAdminsPage() {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState<AdminRecord | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [adminList, hotelList] = await Promise.all([
        getAdmins(),
        getHotels(),
      ]);
      setAdmins(Array.isArray(adminList) ? adminList : []);
      setHotels(Array.isArray(hotelList) ? hotelList : []);
    } catch {
      showToast(t("loadAdminsFailed"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadData();
  }, [loadData]);

  function openAdd() {
    setEditAdmin(null);
    setForm({ ...EMPTY_FORM, hotelId: hotels[0]?._id || "" });
    setModalOpen(true);
  }

  function openEdit(a: AdminRecord) {
    setEditAdmin(a);
    setForm({
      name: a.name,
      email: a.email,
      password: "",
      hotelId: a.hotelId?._id || "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditAdmin(null);
    setForm(EMPTY_FORM);
  }

  function setEmailLocalPart(localPart: string) {
    setForm((f) => ({ ...f, email: toBronitEmail(localPart) }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.hotelId) return;
    setSaving(true);
    try {
      const payload: {
        name: string;
        email: string;
        hotelId: string;
        password?: string;
      } = {
        name: form.name.trim(),
        email: form.email.trim(),
        hotelId: form.hotelId,
      };
      // On create the password is required; on edit an empty field keeps the old one.
      if (form.password) payload.password = form.password;
      await saveAdmin(payload, editAdmin?._id);
      showToast(editAdmin ? t("adminUpdated") : t("adminAdded"), "success");
      closeModal();
      loadData();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("saveAdminFailed"),
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAdmin(id);
      showToast(t("adminDeleted"), "success");
      setDeleteConfirm(null);
      loadData();
    } catch {
      showToast(t("deleteFailed"), "error");
    }
  }

  const noHotels = hotels.length === 0;

  return {
    admins,
    hotels,
    loading,
    modalOpen,
    editAdmin,
    form,
    setForm,
    setEmailLocalPart,
    saving,
    deleteConfirm,
    setDeleteConfirm,
    openAdd,
    openEdit,
    closeModal,
    handleSave,
    handleDelete,
    noHotels,
  };
}

export type AdminsPageState = ReturnType<typeof useAdminsPage>;
