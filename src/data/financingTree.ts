// src/data/financingTree.ts

export interface OutcomeScorecard {
  ownership_retained?: string;
  dilution?: string;
  bankruptcy_risk?: string;
  growth_flexibility?: string;
}

export interface NodeOutcome {
  summary: string;
  details: string;
  scorecard?: OutcomeScorecard;
}

export interface TreeNode {
  id: string;
  name: string;
  description?: string;
  // Leaf nodes have an outcome; internal nodes have children
  outcome?: NodeOutcome;
  children?: TreeNode[];
}

// Root type alias for clarity
export type FinancingTree = TreeNode;

export const financingTree: FinancingTree = {
  id: "root",
  name: "Financing Choice",
  description: "Choose debt or equity to fund a $2M growth plan.",
  children: [
    {
      id: "debt",
      name: "Debt Financing",
      description: "Borrow capital; maintain ownership; fixed obligations.",
      children: [
        {
          id: "term_loan",
          name: "Term Loan",
          description: "Bank loan with fixed rate and amortization.",
          children: [
            {
              id: "term_low_rate",
              name: "Low Rate (6%)",
              outcome: {
                summary: "Manageable interest; high ownership retained.",
                details:
                  "Annual interest ~$120k on $2M; DSCR ≥1.5 if EBITDA ≥$300k; ownership unchanged; downside if rates reset.",
                scorecard: {
                  ownership_retained: "High",
                  dilution: "None",
                  bankruptcy_risk: "Low–Moderate",
                  growth_flexibility: "Moderate",
                },
              },
            },
            {
              id: "term_high_rate",
              name: "High Rate (12%)",
              outcome: {
                summary: "Heavy interest burden; constrained cash flow.",
                details:
                  "Annual interest ~$240k; higher DSCR pressure; covenants limit flexibility; ownership intact but risk increases.",
                scorecard: {
                  ownership_retained: "High",
                  dilution: "None",
                  bankruptcy_risk: "Moderate–High",
                  growth_flexibility: "Low",
                },
              },
            },
          ],
        },
        {
          id: "revolver",
          name: "Revolver (Working Capital)",
          description: "Flexible line tied to receivables or inventory.",
          children: [
            {
              id: "revolver_low_util",
              name: "Low Utilization",
              outcome: {
                summary: "Pay for what you use; strong liquidity buffer.",
                details:
                  "Interest only on drawn amount; supports seasonality; covenants around borrowing base; minimal fixed cost.",
                scorecard: {
                  ownership_retained: "High",
                  dilution: "None",
                  bankruptcy_risk: "Low",
                  growth_flexibility: "High",
                },
              },
            },
            {
              id: "revolver_high_util",
              name: "High Utilization",
              outcome: {
                summary: "Persistent draw elevates cost and risk.",
                details:
                  "Near-constant interest and fees; pressure if collections slow; potential covenant breaches under stress.",
                scorecard: {
                  ownership_retained: "High",
                  dilution: "None",
                  bankruptcy_risk: "Moderate",
                  growth_flexibility: "Moderate",
                },
              },
            },
          ],
        },
        {
          id: "mezz",
          name: "Mezzanine / Venture Debt",
          description: "Higher interest plus warrants; blended cost.",
          children: [
            {
              id: "mezz_standard",
              name: "Standard (10% + warrants)",
              outcome: {
                summary: "Bridges to growth with limited dilution.",
                details:
                  "Cash interest plus small equity kicker; higher cost than bank debt; suitable for growth with near-term revenues.",
                scorecard: {
                  ownership_retained: "Medium–High",
                  dilution: "Low",
                  bankruptcy_risk: "Moderate",
                  growth_flexibility: "Moderate–High",
                },
              },
            },
            {
              id: "venture_debt",
              name: "Venture Debt (interest-only period)",
              outcome: {
                summary: "Extends runway with modest dilution via warrants.",
                details:
                  "Interest-only grace supports milestones; warrants dilute slightly; tight covenants around cash balance.",
                scorecard: {
                  ownership_retained: "Medium–High",
                  dilution: "Low",
                  bankruptcy_risk: "Moderate",
                  growth_flexibility: "High (short-term)",
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: "equity",
      name: "Equity Financing",
      description: "Sell ownership; no fixed payments; share upside.",
      children: [
        {
          id: "angel_seed",
          name: "Angel/Seed Equity",
          description: "Early-stage capital; high risk tolerance.",
          children: [
            {
              id: "angel_15pct",
              name: "Raise $2M for 15%",
              outcome: {
                summary: "Moderate dilution; strong mentor network.",
                details:
                  "No debt burden; investors assist hiring and GTM; pressure for growth milestones; governance light–moderate.",
                scorecard: {
                  ownership_retained: "85%",
                  dilution: "15%",
                  bankruptcy_risk: "Low",
                  growth_flexibility: "High",
                },
              },
            },
            {
              id: "angel_30pct",
              name: "Raise $2M for 30%",
              outcome: {
                summary: "High dilution for stage; easier close.",
                details:
                  "No interest payments; board controls may increase; future rounds may further dilute founders.",
                scorecard: {
                  ownership_retained: "70%",
                  dilution: "30%",
                  bankruptcy_risk: "Low",
                  growth_flexibility: "High",
                },
              },
            },
          ],
        },
        {
          id: "vc_series_a",
          name: "VC Series A",
          description: "Institutional equity with board oversight.",
          children: [
            {
              id: "seriesA_20pct",
              name: "Raise $2M for 20% (preferred)",
              outcome: {
                summary: "Balanced dilution; strong support and signaling.",
                details:
                  "Protective provisions (liquidation prefs 1x non-participating); growth push; follow-on potential.",
                scorecard: {
                  ownership_retained: "80%",
                  dilution: "20%",
                  bankruptcy_risk: "Low",
                  growth_flexibility: "High (with milestones)",
                },
              },
            },
            {
              id: "seriesA_participating",
              name: "Participating Pref",
              outcome: {
                summary: "Founder downside worsens due to participation.",
                details:
                  "Investor both gets 1x preference and participates pro-rata; hurts founder outcomes at mid exits.",
                scorecard: {
                  ownership_retained: "Varies",
                  dilution: "Effective higher",
                  bankruptcy_risk: "Low",
                  growth_flexibility: "High",
                },
              },
            },
          ],
        },
        {
          id: "crowd",
          name: "Crowdfunding",
          description: "Broad investor base; marketing upside.",
          children: [
            {
              id: "crowd_success",
              name: "Campaign Succeeds",
              outcome: {
                summary: "Capital plus community advocates.",
                details:
                  "Brand lift and early adopters; cap table complexity manageable via SPV; limited strategic support.",
                scorecard: {
                  ownership_retained: "Medium–High",
                  dilution: "Low–Medium",
                  bankruptcy_risk: "Low",
                  growth_flexibility: "High",
                },
              },
            },
            {
              id: "crowd_undersub",
              name: "Undersubscribed",
              outcome: {
                summary: "Signal risk; delays roadmap.",
                details:
                  "Public miss can harm credibility; may need bridge financing; revise messaging and traction.",
                scorecard: {
                  ownership_retained: "High",
                  dilution: "Low",
                  bankruptcy_risk: "Low",
                  growth_flexibility: "Medium",
                },
              },
            },
          ],
        },
        {
          id: "convertible",
          name: "Convertible (SAFE/Note)",
          description: "Defers valuation; discounts/caps later.",
          children: [
            {
              id: "safe_with_cap",
              name: "SAFE with $10M cap, 20% discount",
              outcome: {
                summary: "Founder-friendly now, dilution later at cap.",
                details:
                  "No interest, no maturity; dilutes at priced round based on lower of cap or discount.",
                scorecard: {
                  ownership_retained: "Uncertain",
                  dilution: "Deferred",
                  bankruptcy_risk: "Low",
                  growth_flexibility: "High",
                },
              },
            },
            {
              id: "conv_note",
              name: "Convertible Note (8%, 24m maturity)",
              outcome: {
                summary: "Accrues interest; conversion or repayment.",
                details:
                  "Interest accrues; conversion triggers at next round; repayment risk if no qualified financing.",
                scorecard: {
                  ownership_retained: "Uncertain",
                  dilution: "Deferred",
                  bankruptcy_risk: "Low–Moderate",
                  growth_flexibility: "Medium–High",
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
