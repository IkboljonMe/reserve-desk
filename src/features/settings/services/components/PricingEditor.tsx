"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Check,
  ChevronDown,
  BedDouble,
  Users,
} from "lucide-react";
import { useTranslation } from "@/i18n";
import { formatPrice } from "../utils";
import type { PricingPlan, PricingGroup, ClientGroup } from "../types";
import Button from "@/components/ui/Button";

export interface PricingEditorProps {
  plans: PricingPlan[];
  groups: PricingGroup[];
  onChange: (next: { plans: PricingPlan[]; groups: PricingGroup[] }) => void;
  // Room-type names available for 'room' pricing groups (owner + shared hotels).
  roomTypeOptions: string[];
  clientGroups: ClientGroup[];
  resolveGroupMeta: (g: PricingGroup) => { label: string; color: string };
  hotelSelected: boolean;
  // Optional card heading override (e.g. "Pricing plans (45 seats)").
  heading?: string;
  // Legacy flat-price fallback — only supplied by the base (non-variant) editor.
  flatPrice?: number;
  onFlatPrice?: (n: number) => void;
}

// A self-contained pricing editor: renders a base duration→price list plus
// per-room-type / per-client-group pricing cards, and edits the passed
// {plans, groups} value through onChange. Its picker/collapse state is local, so
// several editors (one per service variant) can coexist independently.
export function PricingEditor({
  plans,
  groups,
  onChange,
  roomTypeOptions,
  clientGroups,
  resolveGroupMeta,
  hotelSelected,
  heading,
  flatPrice,
  onFlatPrice,
}: PricingEditorProps) {
  const { t } = useTranslation();

  const [planPicker, setPlanPicker] = useState<
    null | "choose" | "room" | "client"
  >(null);
  const [pickerCategory, setPickerCategory] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(
    new Set(),
  );

  const emit = (next: { plans?: PricingPlan[]; groups?: PricingGroup[] }) =>
    onChange({ plans: next.plans ?? plans, groups: next.groups ?? groups });

  function updatePlan(index: number, key: keyof PricingPlan, value: string) {
    const next = plans.map((p, i) =>
      i === index ? { ...p, [key]: value === "" ? "" : Number(value) } : p,
    );
    emit({ plans: next });
  }

  function removePlan(index: number) {
    emit({ plans: plans.filter((_, i) => i !== index) });
  }

  function confirmAddGroup() {
    if (!planPicker || planPicker === "choose" || !pickerCategory) return;
    const target = planPicker;
    const existing = groups.findIndex(
      (g) => g.target === target && g.category === pickerCategory,
    );
    if (existing !== -1) {
      setCollapsedGroups((prev) => {
        const n = new Set(prev);
        n.delete(existing);
        return n;
      });
    } else {
      emit({
        groups: [
          ...groups,
          {
            target,
            category: pickerCategory,
            rows: [{ duration: 60, price: 0 }],
          },
        ],
      });
    }
    setPlanPicker(null);
    setPickerCategory("");
  }

  function removeGroup(gi: number) {
    emit({ groups: groups.filter((_, i) => i !== gi) });
    setCollapsedGroups((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < gi) next.add(i);
        else if (i > gi) next.add(i - 1);
      });
      return next;
    });
  }

  function toggleGroupCollapse(gi: number) {
    setCollapsedGroups((prev) => {
      const n = new Set(prev);
      if (n.has(gi)) n.delete(gi);
      else n.add(gi);
      return n;
    });
  }

  function addGroupRow(gi: number) {
    emit({
      groups: groups.map((g, i) =>
        i === gi ? { ...g, rows: [...g.rows, { duration: 60, price: 0 }] } : g,
      ),
    });
  }

  function updateGroupRow(
    gi: number,
    ri: number,
    key: keyof PricingPlan,
    value: string,
  ) {
    emit({
      groups: groups.map((g, i) => {
        if (i !== gi) return g;
        return {
          ...g,
          rows: g.rows.map((r, j) =>
            j === ri ? { ...r, [key]: value === "" ? "" : Number(value) } : r,
          ),
        };
      }),
    });
  }

  function removeGroupRow(gi: number, ri: number) {
    emit({
      groups: groups.map((g, i) =>
        i === gi ? { ...g, rows: g.rows.filter((_, j) => j !== ri) } : g,
      ),
    });
  }

  function pickerOptions(): { value: string; label: string }[] {
    if (planPicker === "room") {
      return roomTypeOptions
        .filter(
          (rt) => !groups.some((g) => g.target === "room" && g.category === rt),
        )
        .map((rt) => ({ value: rt, label: rt }));
    }
    if (planPicker === "client") {
      return clientGroups
        .filter(
          (g) =>
            !groups.some(
              (pg) => pg.target === "client" && pg.category === g._id,
            ),
        )
        .map((g) => ({ value: g._id, label: g.name }));
    }
    return [];
  }

  return (
    <div className="bg-(--surface-card) border border-(--brand-100,#e0e7ff) rounded-(--radius-lg) shadow-sm p-4">
      <div className="mb-3.5">
        <h3 className="text-[0.9rem] font-bold text-(--brand-700,#4338ca) m-0">
          {heading || t("pricingPlans")}
        </h3>
        <p className="text-[0.72rem] text-(--gray-500) mt-0.5">
          {t("pricingPlansDesc")}
        </p>
      </div>

      {/* Base duration→price plans */}
      {plans.length > 0 && (
        <div className="flex flex-col gap-2 mb-3 pb-3 border-b border-dashed border-(--gray-200,#e5e7eb)">
          <span className="text-[0.72rem] font-bold text-(--gray-500)">
            {t("generalPlans")}
          </span>
          {plans.map((plan, index) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
                  {t("ratePerHour")}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full px-3 py-2 min-h-9.5 rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-(--gray-200,#e5e7eb) text-(--gray-800) hover:border-(--gray-300) focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)] price-input"
                  value={formatPrice(plan.price)}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    updatePlan(
                      index,
                      "price",
                      digits === "" ? "" : String(Number(digits)),
                    );
                  }}
                  onFocus={(e) => {
                    if (Number(plan.price) === 0)
                      updatePlan(index, "price", "");
                    else e.currentTarget.select();
                  }}
                  onBlur={() => {
                    if (plan.price === "") updatePlan(index, "price", "0");
                  }}
                  placeholder="0"
                  required
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                icon
                className="mt-5.5 text-(--danger)"
                onClick={() => removePlan(index)}
                aria-label={t("removePlanAria", { index: index + 1 })}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Category-scoped pricing group cards */}
      {groups.length > 0 && (
        <div className="flex flex-col gap-2.5 mb-3">
          {groups.map((group, gi) => {
            const meta = resolveGroupMeta(group);
            const collapsed = collapsedGroups.has(gi);
            return (
              <div
                key={gi}
                className="border rounded-lg overflow-hidden bg-white"
                style={{ borderColor: `${meta.color}40` }}
              >
                {/* Card header */}
                <div
                  className="flex items-center gap-2 px-2.5 py-2 cursor-pointer"
                  style={{ background: `${meta.color}10` }}
                  onClick={() => toggleGroupCollapse(gi)}
                >
                  <span
                    className="inline-flex items-center gap-1.25 font-bold text-[0.8rem]"
                    style={{ color: meta.color }}
                  >
                    {group.target === "room" ? (
                      <BedDouble size={14} />
                    ) : (
                      <Users size={14} />
                    )}
                    {meta.label}
                  </span>
                  <span className="text-[0.68rem] text-(--gray-400) uppercase tracking-wider">
                    {group.target === "room" ? t("room") : t("typeClient")}
                  </span>
                  <span className="ml-auto text-[0.7rem] text-(--gray-400)">
                    {group.rows.length}{" "}
                    {group.rows.length === 1
                      ? t("priceLower")
                      : t("pricesWord")}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    icon
                    className="text-(--danger)"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeGroup(gi);
                    }}
                    aria-label={t("removeGroupAria", { label: meta.label })}
                  >
                    <Trash2 size={13} />
                  </Button>
                  <ChevronDown
                    size={15}
                    className="text-(--gray-400) transition-transform duration-150"
                    style={{ transform: collapsed ? "rotate(-90deg)" : "none" }}
                  />
                </div>

                {/* Card body */}
                {!collapsed && (
                  <div className="p-2.5 flex flex-col gap-2">
                    {group.rows.map((row, ri) => (
                      <div key={ri} className="flex gap-3 items-start">
                        <div className="flex flex-col gap-1.5 flex-1">
                          <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
                            {t("ratePerHour")}
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="w-full px-3 py-2 min-h-9.5 rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-(--gray-200,#e5e7eb) text-(--gray-800) hover:border-(--gray-300) focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)] price-input"
                            value={formatPrice(row.price)}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, "");
                              updateGroupRow(
                                gi,
                                ri,
                                "price",
                                digits === "" ? "" : String(Number(digits)),
                              );
                            }}
                            onFocus={(e) => {
                              if (Number(row.price) === 0)
                                updateGroupRow(gi, ri, "price", "");
                              else e.currentTarget.select();
                            }}
                            onBlur={() => {
                              if (row.price === "")
                                updateGroupRow(gi, ri, "price", "0");
                            }}
                            placeholder="0"
                            required
                          />
                        </div>
                          <Button
                            type="button"
                            variant="ghost"
                            icon
                            className="mt-5.5 text-(--danger)"
                            onClick={() => removeGroupRow(gi, ri)}
                            aria-label={t("removePriceAria", { index: ri + 1 })}
                            disabled={group.rows.length === 1}
                          >
                            <Trash2 size={14} />
                          </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="self-start text-xs font-semibold"
                      style={{ color: meta.color }}
                      onClick={() => addGroupRow(gi)}
                    >
                      <Plus size={13} /> {t("addPrice")}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add-plan mini flow */}
      {planPicker === null && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setPlanPicker("choose")}
        >
          <Plus size={13} /> {t("addPricingPlan")}
        </Button>
      )}

      {planPicker === "choose" && (
        <div className="flex flex-col gap-2">
          <span className="text-[0.78rem] font-semibold text-(--gray-600)">
            {t("whoIsPriceFor")}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setPlanPicker("room");
                setPickerCategory("");
              }}
            >
              <BedDouble size={14} /> {t("roomCategoryLabel")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setPlanPicker("client");
                setPickerCategory("");
              }}
            >
              <Users size={14} /> {t("clientGroupLabel")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPlanPicker(null)}
            >
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}

      {(planPicker === "room" || planPicker === "client") &&
        (() => {
          const opts = pickerOptions();
          const emptyMsg =
            planPicker === "room"
              ? !hotelSelected
                ? t("selectHotelFirst")
                : t("noMoreRoomCats")
              : t("noMoreClientGroups");
          return (
            <div className="flex flex-col gap-2">
              <span className="text-[0.78rem] font-semibold text-(--gray-600)">
                {planPicker === "room"
                  ? t("whichRoomCategory")
                  : t("whichClientGroup")}
              </span>
              {opts.length === 0 ? (
                <p className="text-[0.75rem] text-(--gray-500) m-0">
                  {emptyMsg}
                </p>
              ) : (
                <div className="flex gap-2 items-center flex-wrap">
                  <select
                    className="w-auto min-w-45 px-3 py-2 min-h-9.5 rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-(--gray-200,#e5e7eb) text-(--gray-800) hover:border-(--gray-300) focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
                    value={pickerCategory}
                    onChange={(e) => setPickerCategory(e.target.value)}
                    aria-label={t("selectCategory")}
                  >
                    <option value="">{t("chooseDots")}</option>
                    {opts.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    onClick={confirmAddGroup}
                    disabled={!pickerCategory}
                  >
                    <Check size={13} /> {t("add")}
                  </Button>
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => {
                  setPlanPicker(null);
                  setPickerCategory("");
                }}
              >
                {t("cancel")}
              </Button>
            </div>
          );
        })()}

      {/* Flat legacy price fallback when nothing else is defined (base editor only) */}
      {onFlatPrice &&
        plans.length === 0 &&
        groups.length === 0 &&
        planPicker === null && (
          <div className="flex flex-col gap-1.5 mt-3">
            <label className="text-[0.8125rem] font-semibold text-(--gray-500) tracking-tight">
              {t("flatPriceOptional")}
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 min-h-9.5 rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-(--gray-200,#e5e7eb) text-(--gray-800) hover:border-(--gray-300) focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
              value={flatPrice ?? 0}
              onChange={(e) => onFlatPrice(Number(e.target.value))}
            />
          </div>
        )}
    </div>
  );
}
