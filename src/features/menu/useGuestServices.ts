"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/providers/ToastProvider";
import { useTranslation } from "@/i18n";
import {
  getGuestServices,
  createGuestService,
  updateGuestService,
  deleteGuestService,
} from "@/lib/api/menu";
import type { GuestServiceItem } from "./types";

// Admin-side state + mutations for a hotel's guest-hub services. The hotel is
// chosen in MenuPage (shared selector) and passed in, so this hook only owns
// the services list and its modal.
export function useGuestServices(hotelId: string) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const qc = useQueryClient();

  const [editService, setEditService] = useState<GuestServiceItem | null>(null);
  const [serviceOpen, setServiceOpen] = useState(false);

  const query = useQuery<GuestServiceItem[]>({
    queryKey: ["menu", "guest-services", hotelId],
    queryFn: () => getGuestServices(hotelId),
    enabled: !!hotelId,
  });
  const services = query.data ?? [];

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["menu", "guest-services", hotelId] });

  const createMut = useMutation({ mutationFn: createGuestService });
  const updateMut = useMutation({
    mutationFn: (vars: { id: string; data: Partial<GuestServiceItem> }) =>
      updateGuestService(vars.id, vars.data),
  });
  const deleteMut = useMutation({ mutationFn: deleteGuestService });

  const openAdd = () => {
    setEditService(null);
    setServiceOpen(true);
  };
  const openEdit = (s: GuestServiceItem) => {
    setEditService(s);
    setServiceOpen(true);
  };

  const save = async (data: Partial<GuestServiceItem>) => {
    try {
      if (editService)
        await updateMut.mutateAsync({ id: editService._id, data });
      else
        await createMut.mutateAsync({
          ...data,
          hotelId,
        } as Partial<GuestServiceItem> & { hotelId: string });
      setServiceOpen(false);
      invalidate();
      showToast(t("saved"), "success");
    } catch {
      showToast(t("saveFailed"), "error");
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id);
      invalidate();
      showToast(t("deleted"), "success");
    } catch {
      showToast(t("deleteFailed"), "error");
    }
  };

  // Optimistic-free visibility toggle: flips `active` and refetches.
  const toggleActive = async (s: GuestServiceItem) => {
    try {
      await updateMut.mutateAsync({ id: s._id, data: { active: !s.active } });
      invalidate();
    } catch {
      showToast(t("saveFailed"), "error");
    }
  };

  return {
    services,
    loading: query.isLoading,
    saving: createMut.isPending || updateMut.isPending,
    serviceOpen,
    setServiceOpen,
    editService,
    openAdd,
    openEdit,
    save,
    remove,
    toggleActive,
  };
}

export type GuestServicesState = ReturnType<typeof useGuestServices>;
