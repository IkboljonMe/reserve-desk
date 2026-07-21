"use client";

import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/providers/ToastProvider";
import { useDraft } from "@/components/DraftProvider";
import { useTranslation } from "@/i18n";
import {
  Hotel,
  ClientGroup,
  Service,
  PricingPlan,
  PricingGroup,
} from "./types";
import {
  extractHotelId,
  DRAFT_KEY,
  EMPTY_FORM,
  durationError,
  bufferError,
} from "./utils";

// A pricing value edited by a PricingEditor (base pricing or one variant's).
type PricingValue = { plans: PricingPlan[]; groups: PricingGroup[] };

const newVariantId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `v_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export function useServicesPage() {
  const { showToast } = useToast();
  const { getDraft, saveDraft, clearDraft } = useDraft();
  const { t } = useTranslation();

  const [services, setServices] = useState<Service[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [clientGroups, setClientGroups] = useState<ClientGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterHotel, setFilterHotel] = useState(""); // '' = all
  const [filterStatus, setFilterStatus] = useState(""); // '' | 'active' | 'inactive'

  // Form / modal
  const [showForm, setShowForm] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [res, hRes, gRes] = await Promise.all([
      fetch("/api/services"),
      fetch("/api/hotels"),
      fetch("/api/client-groups"),
    ]);
    const data = await res.json();
    const hData = await hRes.json();
    const gData = await gRes.json();
    setServices(Array.isArray(data) ? data : []);
    setHotels(Array.isArray(hData) ? hData : []);
    setClientGroups(Array.isArray(gData) ? gData : []);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    load();
  }, []);

  // Draft auto-save for new service form
  useEffect(() => {
    if (showForm && !editService) saveDraft(DRAFT_KEY, form);
  }, [form, showForm, editService, saveDraft]);

  // Derived: hotel lookup map
  const hotelMap = useMemo(() => {
    const m = new Map<string, Hotel>();
    hotels.forEach((h) => m.set(h._id, h));
    return m;
  }, [hotels]);

  const clientGroupMap = useMemo(() => {
    const m = new Map<string, ClientGroup>();
    clientGroups.forEach((g) => m.set(g._id, g));
    return m;
  }, [clientGroups]);

  // Room-type names available for 'room' pricing groups — the owner hotel's plus
  // every shared hotel's, so a shared service can price each hotel's categories.
  const roomTypeOptions = useMemo(() => {
    const ids = [form.hotelId, ...form.sharedHotelIds];
    return [...new Set(ids.flatMap((id) => hotelMap.get(id)?.roomTypes ?? []))];
  }, [form.hotelId, form.sharedHotelIds, hotelMap]);

  // Resolve a pricing group's display label + color.
  const resolveGroupMeta = useMemo(
    () =>
      (pg: PricingGroup): { label: string; color: string } => {
        if (pg.target === "client") {
          const g = clientGroupMap.get(pg.category);
          return {
            label: g?.name ?? t("unknownGroup"),
            color: g?.color ?? "var(--gray-500)",
          };
        }
        return { label: pg.category, color: "var(--brand-500)" };
      },
    [clientGroupMap, t],
  );

  // Filtered services
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return services.filter((svc) => {
      const hid = extractHotelId(svc.hotelId);
      const belongsToFilterHotel =
        hid === filterHotel || (svc.sharedHotelIds ?? []).includes(filterHotel);
      if (
        q &&
        !svc.name.toLowerCase().includes(q) &&
        !svc.description?.toLowerCase().includes(q)
      )
        return false;
      if (filterHotel && !belongsToFilterHotel) return false;
      if (filterStatus === "active" && !svc.isActive) return false;
      if (filterStatus === "inactive" && svc.isActive) return false;
      return true;
    });
  }, [services, searchQuery, filterHotel, filterStatus]);

  const activeCount = services.filter((s) => s.isActive).length;

  // ── Form helpers ────────────────────────────────────────────────────────────

  function openAddForm() {
    setEditService(null);
    const draft = getDraft<typeof EMPTY_FORM>(DRAFT_KEY);
    if (draft) {
      setForm({ ...EMPTY_FORM, ...draft });
      showToast(t("draftRestored"), "info");
    } else {
      setForm({ ...EMPTY_FORM });
    }
    setShowForm(true);
  }

  function openEditForm(svc: Service) {
    setEditService(svc);
    setForm({
      name: svc.name,
      icon: svc.icon || "Waves",
      description: svc.description,
      hotelId: extractHotelId(svc.hotelId),
      sharedHotelIds: (svc.sharedHotelIds || []).map((h) =>
        typeof h === "string" ? h : (h as { _id: string })._id,
      ),
      openTime: svc.openTime,
      closeTime: svc.closeTime,
      weeklyHours: svc.weeklyHours || [],
      blackoutDates: svc.blackoutDates || [],
      slotDuration: svc.slotDuration,
      capacity: svc.capacity,
      price: svc.price || 0,
      isFree: svc.isFree || false,
      details: svc.details || "",
      bufferTimeBefore: svc.bufferTimeBefore || 0,
      bufferTimeAfter: svc.bufferTimeAfter || 0,
      pricingPlans: svc.pricingPlans || [],
      pricingGroups: svc.pricingGroups || [],
      variants: (svc.variants || []).map((v) => ({
        id: v.id || newVariantId(),
        name: v.name,
        pricingPlans: v.pricingPlans || [],
        pricingGroups: v.pricingGroups || [],
      })),
      color: svc.color,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditService(null);
  }

  function discardDraft() {
    clearDraft(DRAFT_KEY);
    setForm({ ...EMPTY_FORM });
    showToast(t("draftCleared"), "info");
  }

  // ── Pricing (base + per-variant) ────────────────────────────────────────────
  // The PricingEditor component is self-contained and edits a {plans, groups}
  // value; here we just persist that value onto the form (base or a variant).

  function setBasePricing(v: PricingValue) {
    setForm((f) => ({ ...f, pricingPlans: v.plans, pricingGroups: v.groups }));
  }

  function addVariant() {
    setForm((f) => ({
      ...f,
      variants: [
        ...f.variants,
        { id: newVariantId(), name: "", pricingPlans: [], pricingGroups: [] },
      ],
    }));
  }

  function removeVariant(id: string) {
    setForm((f) => ({ ...f, variants: f.variants.filter((v) => v.id !== id) }));
  }

  function updateVariantName(id: string, name: string) {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v) => (v.id === id ? { ...v, name } : v)),
    }));
  }

  function setVariantPricing(id: string, val: PricingValue) {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v) =>
        v.id === id
          ? { ...v, pricingPlans: val.plans, pricingGroups: val.groups }
          : v,
      ),
    }));
  }

  // Validate one pricing block (base pricing or a variant's). Returns an error
  // message to show, or null when valid. Shared by base + every variant.
  function pricingError(
    plans: PricingPlan[],
    groups: PricingGroup[],
  ): string | null {
    if (form.isFree) return null;
    if (plans.some((p) => p.duration === "" || durationError(p.duration)))
      return t("planDurationError");
    const emptyGroup = groups.find((g) => g.rows.length === 0);
    if (emptyGroup)
      return t("addPriceRowError", {
        label: resolveGroupMeta(emptyGroup).label,
      });
    if (
      groups.some((g) =>
        g.rows.some((r) => r.duration === "" || durationError(r.duration)),
      )
    )
      return t("categoryDurationError");
    return null;
  }

  const serializePlans = (plans: PricingPlan[]) =>
    plans.map((p) => ({
      duration: Number(p.duration) || 0,
      price: Number(p.price) || 0,
    }));
  const serializeGroups = (groups: PricingGroup[]) =>
    groups.map((g) => ({
      target: g.target,
      category: g.category,
      rows: serializePlans(g.rows),
    }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.hotelId) {
      showToast(t("selectHotelError"), "error");
      return;
    }

    if (form.variants.length > 0) {
      // Variant-based service: validate each variant instead of the base pricing.
      if (form.variants.some((v) => !v.name.trim())) {
        showToast(t("variantNameRequired"), "error");
        return;
      }
      for (const v of form.variants) {
        const err = pricingError(v.pricingPlans, v.pricingGroups);
        if (err) {
          showToast(`${v.name}: ${err}`, "error");
          return;
        }
      }
    } else {
      const err = pricingError(form.pricingPlans, form.pricingGroups);
      if (err) {
        showToast(err, "error");
        return;
      }
    }

    if (
      bufferError(form.bufferTimeBefore) ||
      bufferError(form.bufferTimeAfter)
    ) {
      showToast(t("bufferTimesError"), "error");
      return;
    }
    setSaving(true);
    try {
      const url = editService
        ? `/api/services/${editService._id}`
        : "/api/services";
      const method = editService ? "PUT" : "POST";
      const payload = {
        ...form,
        pricingPlans: serializePlans(form.pricingPlans),
        pricingGroups: serializeGroups(form.pricingGroups),
        variants: form.variants.map((v) => ({
          id: v.id,
          name: v.name.trim(),
          pricingPlans: serializePlans(v.pricingPlans),
          pricingGroups: serializeGroups(v.pricingGroups),
        })),
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(
          editService ? t("serviceUpdated") : t("serviceCreated"),
          "success",
        );
        if (!editService) clearDraft(DRAFT_KEY);
        closeForm();
        load();
      } else {
        const d = await res.json();
        showToast(d.error || t("saveFailed"), "error");
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(svc: Service) {
    const res = await fetch(`/api/services/${svc._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !svc.isActive }),
    });
    if (res.ok) {
      showToast(
        svc.isActive ? t("serviceDeactivated") : t("serviceActivated"),
        "info",
      );
      load();
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast(t("serviceDeleted"), "success");
      setDeleteConfirm(null);
      load();
    } else showToast(t("deleteFailed"), "error");
  }

  const hasActiveFilters = searchQuery || filterHotel || filterStatus;

  return {
    services,
    hotels,
    clientGroups,
    loading,
    searchQuery,
    setSearchQuery,
    filterHotel,
    setFilterHotel,
    filterStatus,
    setFilterStatus,
    showForm,
    editService,
    form,
    setForm,
    saving,
    deleteConfirm,
    setDeleteConfirm,
    hotelMap,
    resolveGroupMeta,
    roomTypeOptions,
    filtered,
    activeCount,
    hasActiveFilters,
    openAddForm,
    openEditForm,
    closeForm,
    discardDraft,
    setBasePricing,
    addVariant,
    removeVariant,
    updateVariantName,
    setVariantPricing,
    handleSubmit,
    toggleActive,
    handleDelete,
  };
}

export type ServicesPageState = ReturnType<typeof useServicesPage>;
