import { Check, X } from "lucide-react";
import {
  SECTION_TITLE,
  SECTION_SUB,
  PRICING_PLANS,
  PRICING_FEATURES,
  type Translate,
} from "../constants";
import { OpenContactButton } from "./OpenContactButton";

const money = (v: number) => v.toLocaleString("en-US").replace(/,/g, " ");
const CTA_BASE =
  "block w-full text-center py-2 no-underline font-bold text-[0.8rem] cursor-pointer";

// Static pricing comparison table. Plan data is hardcoded (PRICING_PLANS /
// PRICING_FEATURES) — pricing rarely changes and this avoids a DB round-trip.
// The three numeric tiers link to the live demo (we set the account up manually
// after sign-up); the Custom tier opens the call-back contact form.
export function Pricing({ t, demoUrl }: { t: Translate; demoUrl: string }) {
  // Highlighted (Most Popular) column gets a tint across header, rows, footer.
  // Uses the themed --pill-brand-bg var (subtle lavender in light, translucent
  // brand in dark) instead of a fixed pale `bg-brand-50` that washed out and hid
  // the column's text in dark mode.
  const colTint = (highlight: boolean) => (highlight ? "bg-(--pill-brand-bg)" : "");

  return (
    <section id="pricing" className="bg-white border-y border-slate-200">
      <div className="max-w-300 mx-auto px-5 lg:px-10 py-14">
        <h2 className={SECTION_TITLE}>{t("lpPricingTitle")}</h2>
        <p className={SECTION_SUB}>{t("lpPricingSub")}</p>

        {/* Scrolls horizontally on narrow screens. */}
        <div className="overflow-x-auto -mx-5 px-5 lg:mx-0 lg:px-0">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr>
                <th className="w-[34%] p-3 align-bottom" />
                {PRICING_PLANS.map((plan) => (
                  <th
                    key={plan.key}
                    className={`p-3 align-bottom text-center border-b-2 border-slate-200 ${colTint(plan.highlight)}`}
                  >
                    {plan.highlight && (
                      <div className="text-brand-600 text-[0.65rem] font-bold uppercase tracking-wide mb-1">
                        {t("mostPopular")}
                      </div>
                    )}
                    <div className="text-[1rem] font-extrabold text-slate-900">
                      {plan.name}
                    </div>
                    {plan.custom ? (
                      <div className="text-[0.95rem] font-extrabold text-slate-800 mt-1.5">
                        {t("lpPlanCustomPrice")}
                      </div>
                    ) : (
                      <>
                        {/* Original (pre-discount) price, struck through. */}
                        <div className="text-[0.72rem] font-medium text-slate-400 line-through mt-0.5 whitespace-nowrap">
                          {money(Math.round((plan.price * 1.1) / 1000) * 1000)}{" "}
                          {t("sum")}
                        </div>
                        <div className="text-[1.15rem] font-extrabold text-slate-900 whitespace-nowrap">
                          {money(plan.price)}
                          <span className="text-[0.7rem] font-medium text-slate-500">
                            {" "}
                            {t("sum")}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="text-[0.66rem] text-slate-500 mt-0.5 font-medium">
                      {t(plan.custom ? "lpPlanCustomPeriod" : "lpPricePeriod")}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRICING_FEATURES.map((row) => (
                <tr key={row.labelKey} className="border-b border-slate-100">
                  <td className="p-3 text-[0.85rem] text-slate-700">
                    {t(row.labelKey)}
                  </td>
                  {PRICING_PLANS.map((plan) => (
                    <td
                      key={plan.key}
                      className={`p-3 text-center ${colTint(plan.highlight)}`}
                    >
                      {row.plans.includes(plan.key) ? (
                        <Check
                          size={18}
                          strokeWidth={2.5}
                          className="inline text-emerald-500"
                          aria-label={t("yes")}
                        />
                      ) : (
                        <X
                          size={16}
                          strokeWidth={2.5}
                          className="inline text-slate-300"
                          aria-label={t("no")}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="p-3" />
                {PRICING_PLANS.map((plan) => (
                  <td
                    key={plan.key}
                    className={`p-3 align-top ${colTint(plan.highlight)}`}
                  >
                    {plan.custom ? (
                      <OpenContactButton
                        className={`${CTA_BASE} border border-brand-500 text-brand-600 bg-transparent hover:bg-brand-50`}
                      >
                        {t("lpContactUs")}
                      </OpenContactButton>
                    ) : (
                      <a
                        href={demoUrl}
                        className={`${CTA_BASE} ${
                          plan.highlight
                            ? "bg-[linear-gradient(135deg,#4f6ef7,#3b5bdb)] text-white shadow-[0_6px_18px_rgba(79,110,247,0.3)]"
                            : "bg-brand-50 text-brand-600"
                        }`}
                      >
                        {t("lpViewLiveDemo")}
                      </a>
                    )}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="text-center text-slate-600 text-[0.85rem] mt-6 max-w-155 mx-auto">
          {t("lpPricingSetupNote")}
        </p>
        <p className="text-center text-slate-500 text-[0.83rem] mt-2">
          {t("lpPricingContact")}
        </p>
      </div>
    </section>
  );
}
