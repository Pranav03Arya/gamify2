// src/state/sessionStore.ts
import { create } from "zustand";

export type PreferredType = "non-participating" | "participating";
export interface PreferredConfig {
  enabled: boolean;
  type: PreferredType;
  multiple: number; // 1, 1.5, 2
  cap: number | null; // e.g., 2 for 2x cap on participating
  seniority: "standard" | "pari-passu";
}

export interface CustomerFactors {
  aov: number;             // average order value
  cac: number;             // customer acquisition cost
  conversion: number;      // 0..1
  churn: number;           // 0..1 monthly
  grossMargin: number;     // 0..1
  dsoDays: number;         // days sales outstanding
  growthRate: number;      // 0..1 annual
  seasonality: boolean;
}

export interface SelectedScenario {
  // Minimal structure to identify the chosen leaf and its path
  nodeId: string;
  pathIds: string[]; // e.g., ['root','equity','vc_series_a','seriesA_20pct']
}

export interface SessionState {
  mode: "home" | "explore" | "guided" | "dashboard";
  selected?: SelectedScenario;
  factors: CustomerFactors;
  preferred: PreferredConfig;
  setMode: (m: SessionState["mode"]) => void;
  setSelected: (s?: SelectedScenario) => void;
  setFactors: (f: Partial<CustomerFactors>) => void;
  setPreferred: (p: Partial<PreferredConfig>) => void;
  reset: () => void;
}

export const useSession = create<SessionState>((set) => ({
  mode: "home",
  factors: {
    aov: 120,
    cac: 80,
    conversion: 0.03,
    churn: 0.02,
    grossMargin: 0.65,
    dsoDays: 45,
    growthRate: 0.35,
    seasonality: false,
  },
  preferred: {
    enabled: false,
    type: "non-participating",
    multiple: 1,
    cap: null,
    seniority: "standard",
  },
  setMode: (m) => set({ mode: m }),
  setSelected: (s) => set({ selected: s }),
  setFactors: (f) =>
    set((st) => ({ factors: { ...st.factors, ...f } })),
  setPreferred: (p) =>
    set((st) => ({ preferred: { ...st.preferred, ...p } })),
  reset: () =>
    set({
      mode: "home",
      selected: undefined,
      factors: {
        aov: 120,
        cac: 80,
        conversion: 0.03,
        churn: 0.02,
        grossMargin: 0.65,
        dsoDays: 45,
        growthRate: 0.35,
        seasonality: false,
      },
      preferred: {
        enabled: false,
        type: "non-participating",
        multiple: 1,
        cap: null,
        seniority: "standard",
      },
    }),
}));
