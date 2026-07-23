"use client";

import { useTranslation } from "@/i18n";
import { TYPE_META } from "../constants";
import { formatDuration, formatUZS } from "../utils";
import { UNGROUPED } from "../useBookingWizard";
import type { BookingType } from "../types";
import type { BookingWizard } from "../useBookingWizard";

// "Who is this booking for?" + category (client group / room type) + duration & price.
// For custom bookings, and for "ungrouped" clients, price/duration are entered manually.
export function PlanSection({ w }: { w: BookingWizard }) {
  const { t } = useTranslation();
  const {
    selectedService,
    bookingType,
    clientCats,
    roomCats,
    chooseType,
    resolveGroupMeta,
    selectedCategory,
    chooseCategory,
    planRows,
    setSelectedSlot,
    selectedRate,
    chooseRate,
    selectedHours,
    chooseHours,
    wholeDay,
    chooseWholeDay,
    maxHours,
    activePlan,
    categoryMeta,
    customDuration,
    setCustomDuration,
    customValid,
    customPrice,
    setCustomPrice,
    usingManualPrice,
    hasVariants,
    selectedVariant,
    chooseVariant,
  } = w;
  if (!selectedService) return null;

  // With variants, the guest must pick one before the pricing options appear.
  const showPlanOptions = !hasVariants || !!selectedVariant;

  return (
    <div>
      {hasVariants && (
        <div className={showPlanOptions ? "mb-6" : "mb-0"}>
          <label className="form-label block mb-2">{t("chooseVariant")}</label>
          <div className="flex flex-wrap gap-2">
            {(selectedService.variants ?? []).map((v) => {
              const active = selectedVariant?.id === v.id;
              const accent = selectedService.color;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => chooseVariant(v)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 font-bold text-[0.85rem] cursor-pointer transition-all duration-150"
                  style={{
                    border: `2px solid ${active ? accent : "var(--gray-200)"}`,
                    background: active ? `${accent}15` : "var(--surface-card)",
                    color: active ? accent : "var(--gray-800)",
                  }}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!showPlanOptions ? null : (
        <>
          <h2 className="mb-5">{t("whoIsThisFor")}</h2>

          <div
            className="grid gap-3 mb-0"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              marginBottom: bookingType ? "1.5rem" : 0,
            }}
          >
            {(Object.keys(TYPE_META) as BookingType[]).map((type) => {
              const meta = TYPE_META[type];
              // "Clients" always has the Ungrouped/Custom fallback, so it's never disabled.
              const disabled = type === "room" && roomCats.length === 0;
              const active = bookingType === type;
              return (
                <button
                  key={type}
                  type="button"
                  disabled={disabled}
                  onClick={() => chooseType(type)}
                  title={
                    disabled
                      ? t("noPricingSetFor", {
                          label: t(meta.labelKey).toLowerCase(),
                        })
                      : undefined
                  }
                  className="rounded-xl p-4 text-left transition-all duration-150 border-2"
                  style={{
                    borderColor: active ? meta.color : "var(--gray-200)",
                    background: active ? `${meta.color}12` : "var(--surface-card)",
                    opacity: disabled ? 0.45 : 1,
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl mb-2.5 flex items-center justify-center"
                    style={{ background: `${meta.color}18`, color: meta.color }}
                  >
                    {meta.icon}
                  </div>
                  <div className="font-bold text-[0.95rem] text-gray-800">
                    {t(meta.labelKey)}
                  </div>
                  <div className="text-[0.72rem] text-gray-500 mt-0.5">
                    {disabled ? t("notConfigured") : t(meta.descKey)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Category (client group / room type) */}
          {(bookingType === "client" || bookingType === "room") && (
            <>
              <label className="form-label block mb-2">
                {bookingType === "client"
                  ? t("chooseClientGroup")
                  : t("chooseRoomCategory")}
              </label>
              <div
                className="flex flex-wrap gap-2"
                style={{ marginBottom: selectedCategory ? "1.5rem" : 0 }}
              >
                {(bookingType === "client" ? clientCats : roomCats).map((g) => {
                  const meta = resolveGroupMeta(g);
                  const active = selectedCategory === g.category;
                  return (
                    <button
                      key={g.category}
                      type="button"
                      onClick={() => chooseCategory(g.category)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-semibold text-[0.8125rem] cursor-pointer transition-all duration-150"
                      style={{
                        border: `2px solid ${active ? meta.color : "var(--gray-200)"}`,
                        background: active ? `${meta.color}15` : "var(--surface-card)",
                        color: active ? meta.color : "var(--gray-700)",
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: meta.color }}
                      />
                      {meta.label}
                    </button>
                  );
                })}
                {bookingType === "client" && (
                  <button
                    type="button"
                    onClick={() => chooseCategory(UNGROUPED)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-semibold text-[0.8125rem] cursor-pointer transition-all duration-150"
                    style={{
                      border: `2px solid ${selectedCategory === UNGROUPED ? "var(--gray-400)" : "var(--gray-200)"}`,
                      background:
                        selectedCategory === UNGROUPED
                          ? "var(--gray-100)"
                          : "var(--surface-card)",
                      color:
                        selectedCategory === UNGROUPED
                          ? "var(--gray-700)"
                          : "var(--gray-500)",
                    }}
                  >
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    {t("typeCustom")}
                  </button>
                )}
              </div>

              {selectedCategory &&
                !usingManualPrice &&
                (() => {
                  const accent = categoryMeta?.color || selectedService.color;
                  const pillCls = (active: boolean) =>
                    `px-4 py-2 cursor-pointer min-w-16 text-center font-bold text-[0.85rem] transition-all duration-150 border-2`;
                  const pillStyle = (active: boolean) => ({
                    borderColor: active ? accent : "var(--gray-200)",
                    background: active ? `${accent}15` : "var(--surface-card)",
                    color: active ? accent : "var(--gray-700)",
                  });
                  return (
                    <>
                      {/* Rate (per hour) */}
                      <label className="form-label block mb-2">
                        {t("chooseRate")}
                      </label>
                      <div
                        className="flex flex-wrap gap-2"
                        style={{ marginBottom: selectedRate ? "1.5rem" : 0 }}
                      >
                        {planRows.map((plan, i) => {
                          const perHour = Math.round(
                            Number(plan.price) /
                              Math.max(1, Number(plan.duration) / 60),
                          );
                          const active =
                            selectedRate?.duration === plan.duration &&
                            selectedRate?.price === plan.price;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => chooseRate(plan)}
                              className={`${pillCls(active)} px-4 py-2.5 text-left min-w-32.5`}
                              style={pillStyle(active)}
                            >
                              <div
                                className="text-[0.9rem] font-bold"
                                style={{ color: accent }}
                              >
                                {perHour > 0 ? (
                                  <>
                                    {formatUZS(perHour)} {t("sum")}
                                    <span className="text-gray-400 font-medium">
                                      {t("perHour")}
                                    </span>
                                  </>
                                ) : (
                                  t("isFree")
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Hours */}
                      {selectedRate && (
                        <>
                          <label className="form-label block mb-2">
                            {t("chooseHours")}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {Array.from(
                              { length: maxHours },
                              (_, i) => i + 1,
                            ).map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => chooseHours(n)}
                                className={pillCls(
                                  !wholeDay && selectedHours === n,
                                )}
                                style={pillStyle(
                                  !wholeDay && selectedHours === n,
                                )}
                              >
                                {formatDuration(n * 60)}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => chooseWholeDay()}
                              className={pillCls(wholeDay)}
                              style={pillStyle(wholeDay)}
                            >
                              {t("wholeDay")}
                            </button>
                          </div>

                          {/* Live total */}
                          {activePlan && (
                            <div className="mt-3.5 text-sm text-gray-600">
                              {t("total")}:{" "}
                              <strong style={{ color: accent }}>
                                {activePlan.price > 0
                                  ? `${formatUZS(activePlan.price)} ${t("sum")}`
                                  : t("isFree")}
                              </strong>
                              {" · "}
                              {formatDuration(activePlan.duration)}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  );
                })()}
            </>
          )}

          {/* Manual duration & price for "Custom" (ungrouped) clients */}
          {usingManualPrice && (
            <>
              <label className="form-label block mb-2">
                {t("chooseDurationPrice")}
              </label>
              <div className="grid grid-cols-2 gap-4 max-w-105">
                <div className="form-group">
                  <label className="form-label">{t("durationMin")}</label>
                  <input
                    type="number"
                    className="form-input"
                    min={15}
                    step={15}
                    value={customDuration}
                    onChange={(e) => {
                      setCustomDuration(Number(e.target.value));
                      setSelectedSlot("");
                    }}
                    onFocus={(e) => e.currentTarget.select()}
                    aria-invalid={!customValid}
                    style={
                      !customValid
                        ? {
                            borderColor: "var(--danger)",
                            boxShadow: "0 0 0 3px rgba(239,68,68,0.12)",
                          }
                        : undefined
                    }
                  />
                  <small
                    className={`block mt-1 text-[0.7rem] ${customValid ? "text-gray-400" : "text-danger"}`}
                  >
                    {customValid ? t("minute15Intervals") : t("multipleOf15")}
                  </small>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("priceUzs")}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="form-input"
                    value={customPrice ? formatUZS(customPrice) : ""}
                    onChange={(e) =>
                      setCustomPrice(
                        Number(e.target.value.replace(/\D/g, "")) || 0,
                      )
                    }
                    onFocus={(e) => e.currentTarget.select()}
                    placeholder="0"
                  />
                  <small className="block mt-1 text-[0.7rem] text-gray-400">
                    {t("setOneOffPrice")}
                  </small>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
