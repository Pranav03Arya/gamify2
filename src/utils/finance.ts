// src/utils/finance.ts
import { CustomerFactors, PreferredConfig } from "../state/sessionStore";

export interface DebtTerms {
  rate: number;           // e.g., 0.06
  principal: number;      // e.g., 2000000
  interestOnlyMonths?: number;
  amortYears?: number;
  minDSCR?: number;
}

export interface EquityTerms {
  raise: number;          // e.g., 2000000
  soldPct: number;        // e.g., 0.2 (20%)
  liquidationPrefMultiple?: number; // for preferred modeling default 1
  participating?: boolean;
}

export function estimateRevenue(factors: CustomerFactors): number {
  // Simple illustrative model: monthly visits * conversion * AOV * 12
  // Replace visits with a derived variable if needed; here we imply via CAC efficiency
  // Assume a performance relationship: customers acquired per $ is 1/CAC
  const monthlySpend = 100000; // hypothetical spend; make adjustable if needed
  const newCustomers = monthlySpend / Math.max(1, factors.cac);
  const monthlyRevenue = newCustomers * factors.conversion * factors.aov;
  const base = monthlyRevenue * 12;
  const growth = base * factors.growthRate;
  return base + growth; // next-year revenue
}

export function estimateCOGS(revenue: number, grossMargin: number): number {
  return revenue * (1 - grossMargin);
}

export function estimateEBITDA(revenue: number, cogs: number, seasonality: boolean): number {
  // Simple: EBITDA = Revenue - COGS - OpEx proxy
  const opex = revenue * 0.35; // proxy; make adjustable if desired
  let ebitda = revenue - cogs - opex;
  if (seasonality) ebitda *= 0.95; // slight penalty
  return ebitda;
}

export function annualDebtService(terms: DebtTerms): { interest: number; principal: number; total: number } {
  const interest = terms.principal * terms.rate;
  // Approx amortization if provided
  let principal = 0;
  if (terms.amortYears && terms.amortYears > 0) {
    principal = terms.principal / terms.amortYears;
  }
  const total = interest + principal;
  return { interest, principal, total };
}

export function dscr(ebitda: number, debtService: number): number {
  return debtService > 0 ? ebitda / debtService : Infinity;
}

export function postMoneyOwnership(soldPct: number) {
  return 1 - soldPct;
}

// Preferred payout waterfall for a single round investor vs. common
export interface WaterfallResult {
  exit: number;
  investorPayout: number;
  commonPayout: number;
}

export function preferredWaterfallSingleRound(
  exit: number,
  invested: number,
  investorPctAsConverted: number, // e.g., 0.2
  pref: PreferredConfig,
): WaterfallResult {
  if (!pref.enabled) {
    // Simple: all pro-rata
    const investor = exit * investorPctAsConverted;
    return { exit, investorPayout: investor, commonPayout: exit - investor };
  }

  const preference = invested * pref.multiple;

  if (pref.type === "non-participating") {
    const asConverted = exit * investorPctAsConverted;
    const investor = Math.min(exit, Math.max(preference, asConverted));
    return { exit, investorPayout: investor, commonPayout: Math.max(0, exit - investor) };
  }

  // Participating
  // Investor takes preference first, then participates pro-rata in residual until optional cap multiple is met
  let investor = 0;
  const prefTake = Math.min(exit, preference);
  let residual = exit - prefTake;
  investor += prefTake;

  if (residual > 0) {
    const proRataTake = residual * investorPctAsConverted;
    investor += proRataTake;
  }

  if (pref.cap) {
    const capLimit = invested * pref.cap;
    if (investor > capLimit) {
      const over = investor - capLimit;
      investor = capLimit;
      // return over to common
      return { exit, investorPayout: investor, commonPayout: Math.max(0, exit - investor) };
    }
  }

  return { exit, investorPayout: investor, commonPayout: Math.max(0, exit - investor) };
}
