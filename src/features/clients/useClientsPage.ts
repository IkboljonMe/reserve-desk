"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/providers/ToastProvider";
import { useTranslation } from "@/i18n";
import {
  Room,
  Hotel,
  ClientGroup,
  Client,
  EMPTY_FORM,
  extractGroupId,
} from "./types";

export function useClientsPage() {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [groups, setGroups] = useState<ClientGroup[]>([]);
  const [groupFilter, setGroupFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [historyClient, setHistoryClient] = useState<Client | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (groupFilter) params.set("groupId", groupFilter);
      const qs = params.toString();
      const [cr, rr, hr, gr] = await Promise.all([
        fetch(`/api/clients${qs ? `?${qs}` : ""}`),
        fetch("/api/rooms"),
        fetch("/api/hotels"),
        fetch("/api/client-groups"),
      ]);
      const [c, r, h, g] = await Promise.all([
        cr.json(),
        rr.json(),
        hr.json(),
        gr.json(),
      ]);
      setClients(Array.isArray(c) ? c : []);
      setRooms(Array.isArray(r) ? r : []);
      setHotels(Array.isArray(h) ? h : []);
      setGroups(Array.isArray(g) ? g : []);
    } catch {
      showToast(t("loadClientsFailed"), "error");
    } finally {
      setLoading(false);
    }
  }, [search, groupFilter, showToast, t]);

  // Refetch on mount and whenever the search/filter-derived loader changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadData();
  }, [loadData]);

  function openAdd() {
    setEditClient(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  }

  function openEdit(c: Client) {
    setEditClient(c);
    setForm({
      name: c.name,
      phone: c.phone,
      roomNumber: c.roomNumber,
      floor: c.floor,
      notes: c.notes,
      groupId: extractGroupId(c.groupId),
      hotelId: c.hotelId,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditClient(null);
    setForm(EMPTY_FORM);
  }

  // Room display name uses the hotel's compact code, e.g. "FG-202".
  function roomLabel(r: Room) {
    const sn = hotels.find((h) => h._id === r.hotelId)?.shortName || "??";
    return `${sn}-${r.number}`;
  }

  // Auto-fill floor when a room is picked. The stored value is the full label.
  function handleRoomChange(roomNumber: string) {
    const room = rooms.find((r) => roomLabel(r) === roomNumber);
    setForm((f) => ({ ...f, roomNumber, floor: room ? room.floor : f.floor }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const url = editClient
        ? `/api/clients/${editClient._id}`
        : "/api/clients";
      const method = editClient ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      showToast(editClient ? t("clientUpdated") : t("clientAdded"), "success");
      closeModal();
      loadData();
    } catch {
      showToast(t("saveClientFailed"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast(t("clientDeleted"), "success");
      setDeleteConfirm(null);
      loadData();
    } else {
      showToast(t("deleteFailed"), "error");
    }
  }

  // Clients are a global pool, so the room picker offers every hotel's rooms
  // (each label carries its hotel code, e.g. "FG-202"). Groups are global too.
  const modalRooms = rooms;
  const modalGroups = groups;

  // Group by floor for display
  const floorGroups = Array.from(new Set(modalRooms.map((r) => r.floor))).sort(
    (a, b) => a - b,
  );

  // Resolve the full group record for a client (works whether populated or id).
  function clientGroup(c: Client): ClientGroup | null {
    const id = extractGroupId(c.groupId);
    if (!id) return null;
    if (typeof c.groupId === "object" && c.groupId) return c.groupId;
    return groups.find((g) => g._id === id) || null;
  }

  return {
    clients,
    rooms,
    hotels,
    groups,
    groupFilter,
    setGroupFilter,
    search,
    setSearch,
    loading,
    modalOpen,
    editClient,
    form,
    setForm,
    saving,
    deleteConfirm,
    setDeleteConfirm,
    openAdd,
    openEdit,
    closeModal,
    roomLabel,
    handleRoomChange,
    handleSave,
    handleDelete,
    modalRooms,
    modalGroups,
    floorGroups,
    clientGroup,
    historyClient,
    setHistoryClient,
  };
}

export type ClientsPageState = ReturnType<typeof useClientsPage>;
