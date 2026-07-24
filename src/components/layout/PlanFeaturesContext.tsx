"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { FeatureKey } from "@/lib/planFeatures";

// The tenant's enabled features, shared with client pages so they can gate
// in-page sections (e.g. the dashboard's revenue analytics). `undefined` means
// "don't gate" — a legacy business with no configured feature set, or a plan
// lookup we didn't want to hard-fail on. Mirrors the Sidebar's convention.
const PlanFeaturesContext = createContext<FeatureKey[] | undefined>(undefined);

export function PlanFeaturesProvider({
  features,
  children,
}: {
  features?: FeatureKey[];
  children: ReactNode;
}) {
  return (
    <PlanFeaturesContext.Provider value={features}>
      {children}
    </PlanFeaturesContext.Provider>
  );
}

// True when the business may use `feature`. Ungated (undefined) grants everything.
export function usePlanFeature(feature: FeatureKey): boolean {
  const features = useContext(PlanFeaturesContext);
  return features == null || features.includes(feature);
}
