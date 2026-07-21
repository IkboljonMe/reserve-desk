"use client";

import { Building2, Check, X, Plus, Trash2, Layers } from "lucide-react";
import { useTranslation } from "@/i18n";
import { ServiceIcon } from "@/lib/serviceIcons";
import IconPicker from "@/components/IconPicker";
import Select from "@/components/Select";
import { InfoHint } from "@/components/ui/InfoHint";
import Spinner from "@/components/ui/Spinner";
import { PRESET_COLORS, bufferError, selectAllOnFocus } from "../utils";
import { PricingEditor } from "./PricingEditor";
import { ScheduleEditor } from "./ScheduleEditor";
import type { ServicesPageState } from "../useServicesPage";
import Button from "@/components/ui/Button";

export function ServiceFormModal({ s }: { s: ServicesPageState }) {
  const { t } = useTranslation();
  const {
    showForm,
    closeForm,
    editService,
    form,
    setForm,
    hotels,
    handleSubmit,
    discardDraft,
    saving,
    resolveGroupMeta,
    roomTypeOptions,
    clientGroups,
    setBasePricing,
    addVariant,
    removeVariant,
    updateVariantName,
    setVariantPricing,
  } = s;
  if (!showForm) return null;

  return (
    <div className="modal-overlay" onClick={closeForm}>
      <div className="modal max-w-[660px]" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            {/* Preview icon in title */}
            <span
              className="inline-flex items-center justify-center w-8.5 h-8.5 rounded-lg shrink-0 border-[1.5px] border-solid"
              style={{
                background: `${form.color}18`,
                borderColor: `${form.color}40`,
                color: form.color,
              }}
            >
              <ServiceIcon name={form.icon} size={18} />
            </span>
            <h2 className="m-0 text-lg font-bold">
              {editService
                ? t("editColon", { name: editService.name })
                : t("addService")}
            </h2>
          </div>
          <Button
            variant="ghost"
            icon
            onClick={closeForm}
            aria-label={t("close")}
          >
            <X size={18} />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
                  {t("name")} *<InfoHint text={t("nameHint")} />
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[--gray-800] hover:border-[var(--gray-300)] focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
                  {t("icon")} *<InfoHint text={t("iconHint")} />
                </label>
                <IconPicker
                  value={form.icon}
                  onChange={(name) => setForm((f) => ({ ...f, icon: name }))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
                {t("hotel")} *<InfoHint text={t("hotelHint")} />
              </label>
              <Select
                ariaLabel={t("selectHotel")}
                placeholder={t("selectHotel")}
                icon={<Building2 size={16} />}
                value={form.hotelId}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    hotelId: v,
                    // Drop the new owner from the shared list if it was there.
                    sharedHotelIds: f.sharedHotelIds.filter((id) => id !== v),
                  }))
                }
                options={hotels.map((h) => ({ value: h._id, label: h.name }))}
              />
            </div>

            {form.hotelId && hotels.length > 1 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
                  {t("sharedWithHotels")}
                  <InfoHint text={t("sharedWithHotelsHint")} />
                </label>
                <div className="flex flex-wrap gap-2">
                  {hotels
                    .filter((h) => h._id !== form.hotelId)
                    .map((h) => {
                      const on = form.sharedHotelIds.includes(h._id);
                      return (
                        <button
                          key={h._id}
                          type="button"
                          className={`px-3.5 py-1.5 rounded-full text-[0.8rem] font-semibold cursor-pointer border transition-all duration-150 whitespace-nowrap inline-flex items-center gap-1.25 ${
                            on
                              ? "bg-gradient-to-r from-[var(--brand-500)] to-[var(--brand-600)] text-white border-transparent shadow-[var(--shadow-brand)]"
                              : "border-[var(--gray-200,#e5e7eb)] bg-(--surface-card) text-[var(--gray-600,#4b5563)] hover:border-[var(--brand-500,#6366f1)] hover:text-[var(--brand-700,#4338ca)] hover:bg-[var(--brand-50,#eef2ff)]"
                          }`}
                          aria-pressed={on}
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              sharedHotelIds: on
                                ? f.sharedHotelIds.filter((id) => id !== h._id)
                                : [...f.sharedHotelIds, h._id],
                            }))
                          }
                        >
                          {on ? <Check size={12} /> : <Building2 size={12} />}{" "}
                          {h.name}
                        </button>
                      );
                    })}
                </div>
                <small className="mt-1.5 text-[0.7rem] text-(--gray-400) block">
                  {t("sharedWithHotelsHint")}
                </small>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
                {t("description")}
                <InfoHint text={t("descriptionHint")} />
              </label>
              <textarea
                className="w-full px-3 py-2 min-h-[60px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[--gray-800] hover:border-[var(--gray-300)] focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)] resize-y"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
                {t("details")}
                <InfoHint text={t("detailsHint")} />
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[--gray-800] hover:border-[var(--gray-300)] focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
                placeholder={t("detailsPlaceholder")}
                value={form.details}
                onChange={(e) =>
                  setForm((f) => ({ ...f, details: e.target.value }))
                }
              />
            </div>

            <div className="h-px bg-surface-border my-1" />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
                  {t("opensAt")} *<InfoHint text={t("opensAtHint")} />
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[--gray-800] hover:border-[var(--gray-300)] focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
                  value={form.openTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, openTime: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
                  {t("closesAt")} *<InfoHint text={t("closesAtHint")} />
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[--gray-800] hover:border-[var(--gray-300)] focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
                  value={form.closeTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, closeTime: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
                  {t("bufferBefore")}
                  <InfoHint text={t("bufferBeforeHint")} />
                </label>
                <input
                  type="number"
                  className={`w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border text-[--gray-800] hover:border-[var(--gray-300)] focus:border-(--brand-500,#6366f1) hide-arrows ${
                    bufferError(form.bufferTimeBefore)
                      ? "border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.14)]"
                      : "border-[var(--gray-200,#e5e7eb)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
                  }`}
                  min={0}
                  max={120}
                  step={15}
                  placeholder="e.g. 15"
                  value={form.bufferTimeBefore}
                  onFocus={selectAllOnFocus}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      bufferTimeBefore: Number(e.target.value),
                    }))
                  }
                  aria-invalid={bufferError(form.bufferTimeBefore)}
                />
                {bufferError(form.bufferTimeBefore) ? (
                  <small className="mt-1 text-xs text-[var(--danger,#ef4444)] block">
                    {t("mustBe15")}
                  </small>
                ) : (
                  <small className="mt-1 text-[0.7rem] text-(--gray-400) block">
                    {t("min15IntervalsShort")}
                  </small>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
                  {t("bufferAfter")}
                  <InfoHint text={t("bufferAfterHint")} />
                </label>
                <input
                  type="number"
                  className={`w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border text-[--gray-800] hover:border-[var(--gray-300)] focus:border-(--brand-500,#6366f1) hide-arrows ${
                    bufferError(form.bufferTimeAfter)
                      ? "border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.14)]"
                      : "border-[var(--gray-200,#e5e7eb)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
                  }`}
                  min={0}
                  max={120}
                  step={15}
                  placeholder="e.g. 15"
                  value={form.bufferTimeAfter}
                  onFocus={selectAllOnFocus}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      bufferTimeAfter: Number(e.target.value),
                    }))
                  }
                  aria-invalid={bufferError(form.bufferTimeAfter)}
                />
                {bufferError(form.bufferTimeAfter) ? (
                  <small className="mt-1 text-xs text-[var(--danger,#ef4444)] block">
                    {t("mustBe15")}
                  </small>
                ) : (
                  <small className="mt-1 text-[0.7rem] text-(--gray-400) block">
                    {t("min15IntervalsShort")}
                  </small>
                )}
              </div>
            </div>

            <ScheduleEditor
              weeklyHours={form.weeklyHours}
              blackoutDates={form.blackoutDates}
              defaultOpen={form.openTime}
              defaultClose={form.closeTime}
              onChange={(next) =>
                setForm((f) => ({
                  ...f,
                  ...(next.weeklyHours !== undefined && {
                    weeklyHours: next.weeklyHours,
                  }),
                  ...(next.blackoutDates !== undefined && {
                    blackoutDates: next.blackoutDates,
                  }),
                }))
              }
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
                {t("calendarColor")}
                <InfoHint text={t("calendarColorHint")} />
              </label>
              <div className="flex gap-2 flex-wrap mt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-6.5 h-6.5 rounded-full cursor-pointer border-2 border-white transition-all duration-[120ms] hover:scale-115 ${
                      form.color === c
                        ? "shadow-[0_0_0_2px_var(--color-gray-900,#1f2937)]"
                        : "shadow-[0_0_0_1.5px_var(--color-gray-200,#e5e7eb)]"
                    }`}
                    style={{ background: c }}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    title={c}
                    aria-label={t("calendarColorAria", { color: c })}
                    aria-pressed={form.color === c}
                  />
                ))}
              </div>
            </div>

            {/* ── Pricing: either a single block, or one block per variant ── */}
            {form.variants.length === 0 ? (
              <>
                <PricingEditor
                  plans={form.pricingPlans}
                  groups={form.pricingGroups}
                  onChange={setBasePricing}
                  roomTypeOptions={roomTypeOptions}
                  clientGroups={clientGroups}
                  resolveGroupMeta={resolveGroupMeta}
                  hotelSelected={!!form.hotelId}
                  flatPrice={form.price}
                  onFlatPrice={(n) => setForm((f) => ({ ...f, price: n }))}
                />
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addVariant}
                  >
                    <Layers size={14} /> {t("addVariant")}
                  </Button>
                  <small className="mt-1.5 text-[0.7rem] text-(--gray-400) block">
                    {t("variantsHint")}
                  </small>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3.5">
                <div>
                  <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight flex items-center gap-1.5">
                    <Layers size={14} /> {t("serviceVariants")}
                  </label>
                  <small className="mt-1.5 text-[0.7rem] text-(--gray-400) block">
                    {t("variantsHint")}
                  </small>
                </div>

                {form.variants.map((v) => (
                  <div
                    key={v.id}
                    className="border border-[var(--gray-200,#e5e7eb)] rounded-xl p-3.5 flex flex-col gap-3 bg-white"
                  >
                    <div className="flex gap-2 items-end">
                      <div className="flex flex-col gap-1.5 flex-1 m-0">
                        <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
                          {t("variantName")} *
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[--gray-800] hover:border-[var(--gray-300)] focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
                          value={v.name}
                          placeholder={t("variantNamePlaceholder")}
                          onChange={(e) =>
                            updateVariantName(v.id, e.target.value)
                          }
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        icon
                        className="text-[var(--danger)]"
                        onClick={() => removeVariant(v.id)}
                        aria-label={t("removeVariant", { name: v.name || "" })}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    <PricingEditor
                      plans={v.pricingPlans}
                      groups={v.pricingGroups}
                      onChange={(val) => setVariantPricing(v.id, val)}
                      roomTypeOptions={roomTypeOptions}
                      clientGroups={clientGroups}
                      resolveGroupMeta={resolveGroupMeta}
                      hotelSelected={!!form.hotelId}
                      heading={t("pricingPlansFor", {
                        name: v.name || t("variant"),
                      })}
                    />
                  </div>
                ))}

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="self-start"
                  onClick={addVariant}
                >
                  <Plus size={14} /> {t("addVariant")}
                </Button>
              </div>
            )}
          </div>

          <div className="h-px bg-surface-border my-4" />
          <div className="flex gap-3 justify-between items-center">
            {!editService ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={discardDraft}
                className="text-(--gray-400)"
              >
                {t("discardDraft")}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={closeForm}>
                {t("cancel")}
              </Button>
              <Button id="save-service-btn" type="submit" disabled={saving}>
                {saving ? <Spinner size={18} dark={false} /> : null}
                {saving ? t("saving") : editService ? t("save") : t("save")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
