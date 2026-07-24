"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/providers/ToastProvider";
import { useTranslation } from "@/i18n";
import {
  getOrders,
  saveOrder,
  deleteOrder,
  provisionOrder,
  type OrderRecord,
  type OrderStatus,
} from "@/lib/api/orders";
import {
  OFFERINGS,
  OFFERING_BY_KEY,
  PRESET_OFFERINGS,
  monthlySubtotal,
  orderTotal,
  type BillingCycle,
} from "@/lib/offerings";

// A line as held in the builder: the offering key maps to its (editable) price
// and quantity. Kept as a map so toggling an offering on/off is trivial.
export type FormLine = { unitPrice: number; quantity: number };
export type FormLines = Record<string, FormLine>;

export const EMPTY_FORM = {
  businessName: "",
  contactName: "",
  contactPhone: "",
  lines: {} as FormLines,
  billingCycle: "monthly" as BillingCycle,
  discountPercent: 0,
  paymentMethod: "",
  paymentDate: "",
  note: "",
  status: "draft" as OrderStatus,
};

export type OrderForm = typeof EMPTY_FORM;

// Effective quantity for a line — flat offerings are always 1.
function effectiveQty(key: string, line: FormLine): number {
  return OFFERING_BY_KEY[key]?.unit === "flat" ? 1 : line.quantity;
}

// Convert the builder's line map into the array the pricing helpers/API expect.
export function linesToArray(lines: FormLines) {
  return Object.entries(lines).map(([offeringKey, l]) => ({
    offeringKey,
    unitPrice: l.unitPrice,
    quantity: effectiveQty(offeringKey, l),
  }));
}

export function useOrdersPage() {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<OrderRecord | null>(null);
  const [form, setForm] = useState<OrderForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Provisioning ("turn into a business") lives in its own little modal.
  const [provisionTarget, setProvisionTarget] = useState<OrderRecord | null>(null);
  const [provForm, setProvForm] = useState({ ownerEmail: "", ownerPassword: "" });
  const [provisioning, setProvisioning] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await getOrders());
    } catch {
      showToast(t("loadOrdersFailed"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadData();
  }, [loadData]);

  function openAdd() {
    setEditOrder(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(o: OrderRecord) {
    setEditOrder(o);
    const lines: FormLines = {};
    for (const l of o.lines) lines[l.offeringKey] = { unitPrice: l.unitPrice, quantity: l.quantity };
    setForm({
      businessName: o.businessName,
      contactName: o.contactName,
      contactPhone: o.contactPhone,
      lines,
      billingCycle: o.billingCycle,
      discountPercent: o.discountPercent,
      paymentMethod: o.paymentMethod,
      paymentDate: o.paymentDate ? o.paymentDate.slice(0, 10) : "",
      note: o.note ?? "",
      status: o.status,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditOrder(null);
    setForm(EMPTY_FORM);
  }

  function setField<K extends keyof OrderForm>(key: K, value: OrderForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Add/remove an offering. Adding seeds the catalog default price and qty 1.
  function toggleOffering(key: string) {
    setForm((f) => {
      const lines = { ...f.lines };
      if (lines[key]) delete lines[key];
      else lines[key] = { unitPrice: OFFERING_BY_KEY[key]?.defaultPrice ?? 0, quantity: 1 };
      return { ...f, lines };
    });
  }

  function setLinePrice(key: string, unitPrice: number) {
    setForm((f) => ({ ...f, lines: { ...f.lines, [key]: { ...f.lines[key], unitPrice: Math.max(0, unitPrice) } } }));
  }

  function setLineQty(key: string, quantity: number) {
    setForm((f) => ({ ...f, lines: { ...f.lines, [key]: { ...f.lines[key], quantity: Math.max(1, quantity) } } }));
  }

  // Replace the current lines with a preset bundle (each at catalog default).
  function applyPreset(preset: keyof typeof PRESET_OFFERINGS) {
    const lines: FormLines = {};
    for (const key of PRESET_OFFERINGS[preset] ?? []) {
      lines[key] = { unitPrice: OFFERING_BY_KEY[key]?.defaultPrice ?? 0, quantity: 1 };
    }
    setForm((f) => ({ ...f, lines }));
  }

  const lineArr = linesToArray(form.lines);
  const subtotal = monthlySubtotal(lineArr);
  const total = orderTotal(lineArr, form.billingCycle, form.discountPercent);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.businessName.trim() || Object.keys(form.lines).length === 0) return;
    setSaving(true);
    try {
      await saveOrder(
        {
          businessName: form.businessName.trim(),
          contactName: form.contactName.trim(),
          contactPhone: form.contactPhone.trim(),
          lines: linesToArray(form.lines),
          billingCycle: form.billingCycle,
          discountPercent: form.discountPercent,
          paymentMethod: form.paymentMethod.trim(),
          paymentDate: form.paymentDate || null,
          note: form.note.trim(),
          status: form.status,
        },
        editOrder?._id,
      );
      showToast(editOrder ? t("orderUpdated") : t("orderCreated"), "success");
      closeModal();
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("saveOrderFailed"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteOrder(id);
      showToast(t("orderDeleted"), "success");
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("deleteFailed"), "error");
    }
  }

  function openProvision(o: OrderRecord) {
    setProvisionTarget(o);
    setProvForm({ ownerEmail: "", ownerPassword: "" });
  }

  function closeProvision() {
    setProvisionTarget(null);
  }

  async function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    if (!provisionTarget || !provForm.ownerEmail.trim() || !provForm.ownerPassword) return;
    setProvisioning(true);
    try {
      await provisionOrder(provisionTarget._id, provForm.ownerEmail.trim(), provForm.ownerPassword);
      showToast(t("businessProvisioned"), "success");
      closeProvision();
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("provisionFailed"), "error");
    } finally {
      setProvisioning(false);
    }
  }

  return {
    orders,
    offerings: OFFERINGS,
    loading,
    modalOpen,
    editOrder,
    form,
    setField,
    toggleOffering,
    setLinePrice,
    setLineQty,
    applyPreset,
    subtotal,
    total,
    saving,
    deleteConfirm,
    setDeleteConfirm,
    openAdd,
    openEdit,
    closeModal,
    handleSave,
    handleDelete,
    provisionTarget,
    provForm,
    setProvForm,
    provisioning,
    openProvision,
    closeProvision,
    handleProvision,
  };
}

export type OrdersPageState = ReturnType<typeof useOrdersPage>;
