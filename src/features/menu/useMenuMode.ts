"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/providers/ToastProvider";
import { useTranslation } from "@/i18n";
import { getMenuMode, setMenuMode, type MenuMode } from "@/lib/api/menu";

// Company-level menu scope: whether all hotels share one menu, and which hotel
// is the shared source. Owner-only to change (enforced server-side).
export function useMenuMode() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const qc = useQueryClient();

  const query = useQuery<MenuMode>({
    queryKey: ["menu", "mode"],
    queryFn: getMenuMode,
  });

  const mut = useMutation({
    mutationFn: setMenuMode,
    onSuccess: (data) => {
      qc.setQueryData(["menu", "mode"], data);
      // Content scope may have changed — refetch categories/products.
      qc.invalidateQueries({ queryKey: ["menu", "categories"] });
      qc.invalidateQueries({ queryKey: ["menu", "products"] });
    },
  });

  const mode = query.data?.mode ?? "per_hotel";
  const sourceHotelId = query.data?.sourceHotelId ?? null;

  const update = async (data: { mode: "per_hotel" | "shared"; sourceHotelId?: string | null }) => {
    try {
      await mut.mutateAsync(data);
      showToast(t("saved"), "success");
    } catch {
      showToast(t("saveFailed"), "error");
    }
  };

  return {
    mode,
    sourceHotelId,
    shared: mode === "shared",
    loading: query.isLoading,
    saving: mut.isPending,
    update,
  };
}

export type MenuModeState = ReturnType<typeof useMenuMode>;
