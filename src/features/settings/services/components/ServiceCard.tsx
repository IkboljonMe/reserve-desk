"use client";

import {
  Building2,
  Clock,
  Users,
  Pencil,
  Trash2,
  Check,
  X,
  Zap,
  BedDouble,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useTranslation } from "@/i18n";
import { ServiceIcon } from "@/lib/serviceIcons";
import { Badge } from "@/components/ui/Badge";
import type { Service, PricingGroup } from "../types";
import Button from "@/components/ui/Button";

export function ServiceCard({
  svc,
  hotelName,
  onEdit,
  onToggleActive,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  deleteConfirm,
  groupMeta,
}: {
  svc: Service;
  hotelName: string | undefined;
  onEdit: () => void;
  onToggleActive: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  deleteConfirm: boolean;
  groupMeta: (g: PricingGroup) => { label: string; color: string };
}) {
  const { t } = useTranslation();
  const hasPlans = svc.pricingPlans && svc.pricingPlans.length > 0;
  const hasGroups = svc.pricingGroups && svc.pricingGroups.length > 0;
  const hasBuffer =
    (svc.bufferTimeBefore ?? 0) > 0 || (svc.bufferTimeAfter ?? 0) > 0;

  return (
    <div
      className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[var(--radius-lg)] shadow-sm flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-t-3"
      style={{ borderTopColor: svc.color }}
    >
      {/* Card Header */}
      <div className="px-5 py-3.5 flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border-[1.5px] border-solid"
          style={{
            background: `${svc.color}18`,
            border: `1.5px solid ${svc.color}40`,
            color: svc.color,
          }}
        >
          <ServiceIcon
            name={svc.icon}
            serviceName={svc.name}
            size={22}
            strokeWidth={1.75}
          />
        </div>

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="font-bold text-[0.9375rem] text-[--gray-800] tracking-tight overflow-hidden text-ellipsis whitespace-nowrap">
              {svc.name}
            </span>
            {/* Status dot */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[0.7rem] tracking-wide border ${
                svc.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-[var(--gray-100,#f3f4f6)] text-[var(--gray-500,#6b7280)] border-[var(--gray-200,#e5e7eb)]"
              }`}
            >
              <span
                className={`w-1.25 h-1.25 rounded-full shrink-0 ${svc.isActive ? "bg-emerald-500" : "bg-[var(--gray-400)]"}`}
              />
              {svc.isActive ? t("active") : t("inactive")}
            </span>
          </div>

          {/* Hotel tag */}
          {hotelName && (
            <div className="flex items-center gap-1 text-[0.72rem] text-[var(--gray-400)]">
              <Building2 size={11} />
              <span>{hotelName}</span>
              {(svc.sharedHotelIds?.length ?? 0) > 0 && (
                <span className="text-[var(--brand-600,#4f46e5)] font-semibold">
                  {t("plusNHotels", { count: svc.sharedHotelIds!.length })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick toggle */}
        <button
          onClick={onToggleActive}
          title={svc.isActive ? t("deactivate") : t("activate")}
          aria-label={
            svc.isActive ? t("deactivateService") : t("activateService")
          }
          className={`bg-transparent border-0 cursor-pointer p-1 shrink-0 transition-colors duration-150 ${
            svc.isActive ? "text-emerald-500" : "text-[var(--gray-300)]"
          }`}
        >
          {svc.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
        </button>
      </div>

      {/* Description */}
      {svc.description && (
        <div className="px-5 pb-3 text-[0.775rem] text-[var(--gray-500)] leading-normal">
          {svc.description}
        </div>
      )}

      {/* Pricing chips */}
      {hasPlans && (
        <div className="px-5 pb-3.5 flex gap-1.5 flex-wrap">
          {svc.pricingPlans!.map((plan, i) => (
            <span
              key={i}
              className="px-2.5 py-0.5 rounded-full text-[0.72rem] font-semibold border border-solid"
              style={{
                background: `${svc.color}12`,
                borderColor: `${svc.color}30`,
                color: svc.color,
              }}
            >
              {plan.duration}m · {Number(plan.price).toLocaleString()}{" "}
              {t("sum")}
            </span>
          ))}
        </div>
      )}
      {svc.isFree && !hasPlans && (
        <div className="px-5 pb-3.5">
          <Badge variant="blue">{t("isFree")}</Badge>
        </div>
      )}

      {/* Category pricing summary */}
      {hasGroups && (
        <div className="px-5 pb-3.5 flex flex-col gap-1.5">
          {svc.pricingGroups!.map((g, i) => {
            const meta = groupMeta(g);
            return (
              <div key={i} className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="inline-flex items-center gap-1 text-[0.68rem] font-bold"
                  style={{ color: meta.color }}
                >
                  {g.target === "room" ? (
                    <BedDouble size={11} />
                  ) : (
                    <Users size={11} />
                  )}
                  {meta.label}
                </span>
                {g.rows.map((r, j) => (
                  <span
                    key={j}
                    className="px-2 py-0.5 rounded-full text-[0.68rem] font-semibold border border-solid"
                    style={{
                      background: `${meta.color}12`,
                      borderColor: `${meta.color}30`,
                      color: meta.color,
                    }}
                  >
                    {r.duration}m · {Number(r.price).toLocaleString()}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer meta */}
      <div className="mt-auto border-t border-[var(--surface-border)] px-5 py-2.5 flex items-center gap-3 bg-[var(--gray-50,#f9fafb)]">
        <span className="flex items-center gap-1 text-[0.72rem] text-[var(--gray-400)]">
          <Clock size={11} />
          {svc.openTime}–{svc.closeTime}
        </span>
        <span className="flex items-center gap-1 text-[0.72rem] text-[var(--gray-400)]">
          <Users size={11} />
          {svc.capacity}
        </span>
        {hasBuffer && (
          <span className="flex items-center gap-1 text-[0.72rem] text-[var(--warning,#f59e0b)]">
            <Zap size={10} />
            {svc.bufferTimeBefore || 0}+{svc.bufferTimeAfter || 0}m
          </span>
        )}

        {/* Action buttons pushed right */}
        <div className="ml-auto flex gap-0.5">
          {deleteConfirm ? (
            <>
              <Button
                variant="danger"
                icon
                onClick={onDeleteConfirm}
                aria-label={t("confirmDelete")}
              >
                <Check size={13} />
              </Button>
              <Button
                variant="ghost"
                icon
                onClick={onDeleteCancel}
                aria-label={t("cancelDelete")}
              >
                <X size={13} />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                icon
                onClick={onEdit}
                title={t("edit")}
                aria-label={t("editNamed", { name: svc.name })}
              >
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost"
                icon
                onClick={onDeleteRequest}
                title={t("delete")}
                aria-label={t("deleteNamed", { name: svc.name })}
                className="text-[var(--danger)]"
              >
                <Trash2 size={14} />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
