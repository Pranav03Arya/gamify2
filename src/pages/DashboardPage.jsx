import React, { useMemo, useState } from "react";
import { useSession } from "../state/sessionStore.ts";
import {
  estimateRevenue,
  estimateCOGS,
  estimateEBITDA,
  annualDebtService,
  dscr,
  postMoneyOwnership,
  preferredWaterfallSingleRound,
} from "../utils/finance.ts";

export default function DashboardPage() {
  const { selected, factors, setFactors, preferred, setPreferred } = useSession();

  const isDebt = selected?.pathIds?.includes("debt");
  const isEquity = selected?.pathIds?.includes("equity");

  const debtTerms = useMemo(() => {
    if (!isDebt) return undefined;
    if (selected?.pathIds.includes("term_low_rate"))
      return { rate: 0.06, principal: 2000000, amortYears: 5, minDSCR: 1.2 };
    if (selected?.pathIds.includes("term_high_rate"))
      return { rate: 0.12, principal: 2000000, amortYears: 5, minDSCR: 1.3 };
    if (selected?.pathIds.includes("revolver_low_util"))
      return { rate: 0.10, principal: 1000000, amortYears: 3, minDSCR: 1.1 };
    return { rate: 0.10, principal: 2000000, amortYears: 5, minDSCR: 1.2 };
  }, [selected, isDebt]);

  const equityTerms = useMemo(() => {
    if (!isEquity) return undefined;
    if (selected?.pathIds.includes("seriesA_20pct"))
      return { raise: 2000000, soldPct: 0.2, liquidationPrefMultiple: 1 };
    if (selected?.pathIds.includes("angel_15pct"))
      return { raise: 2000000, soldPct: 0.15, liquidationPrefMultiple: 1 };
    return { raise: 2000000, soldPct: 0.2, liquidationPrefMultiple: 1 };
  }, [selected, isEquity]);

  // KPIs
  const revenue = estimateRevenue(factors);
  const cogs = estimateCOGS(revenue, factors.grossMargin);
  const ebitda = estimateEBITDA(revenue, cogs, factors.seasonality);

  const debtSvc = debtTerms ? annualDebtService(debtTerms) : undefined;
  const dscrVal = debtSvc ? dscr(ebitda, debtSvc.total) : undefined;

  const ownership = equityTerms ? postMoneyOwnership(equityTerms.soldPct) : undefined;
  const dilution = equityTerms ? equityTerms.soldPct : undefined;

  // Exit focus + points (used only in 4th template)
  const [exitMid, setExitMid] = useState(20_000_000);
  /** @type {{ exit:number; investor:number; common:number }[]} */
  const wfPoints = useMemo(() => {
    const pts = [];
    if (!equityTerms) return pts;
    const invested = equityTerms.raise;
    const asConvertedPct = equityTerms.soldPct;
    for (let exit = 5_000_000; exit <= 50_000_000; exit += 5_000_000) {
      const r = preferredWaterfallSingleRound(exit, invested, asConvertedPct, preferred);
      pts.push({ exit, investor: r.investorPayout, common: r.commonPayout });
    }
    return pts;
  }, [equityTerms, preferred]);

  return (
    <div className="dash page-bg">
      <header className="dash-head ProseMax">
        <div>
          <h2>Scenario Dashboard</h2>
          <p className="muted">
            Path: {selected?.pathIds?.join(" › ") || "No scenario selected yet"}
          </p>
        </div>
        <div className="head-actions">
          <span className="mode-tag">{isDebt ? "Debt" : isEquity ? "Equity" : "—"}</span>
        </div>
      </header>

      {/* KPI row */}
      <section className="kpi-row ProseMax">
        <KPI label="Revenue (next year est.)" value={`$${(revenue/1_000_000).toFixed(2)}M`} tone="neutral" />
        <KPI label="EBITDA (est.)" value={`$${(ebitda/1_000_000).toFixed(2)}M`} tone={ebitda >= 0 ? "good" : "bad"} />
        {debtSvc && <KPI label="Interest" value={`$${(debtSvc.interest/1_000).toFixed(0)}k`} tone="info" />}
        {debtSvc && <KPI label="Debt Service" value={`$${(debtSvc.total/1_000).toFixed(0)}k`} tone="info" />}
        {dscrVal !== undefined && (
          <KPI label="DSCR" value={dscrVal.toFixed(2)} tone={dscrVal >= (debtTerms?.minDSCR ?? 1.2) ? "good" : "bad"} />
        )}
        {ownership !== undefined && <KPI label="Ownership (post)" value={`${(ownership*100).toFixed(0)}%`} tone="neutral" />}
        {dilution !== undefined && <KPI label="Dilution" value={`${(dilution*100).toFixed(0)}%`} tone="warn" />}
      </section>

      {/* ROW 1: three compact templates (NO charts in Preferred card) */}
      <section className="grid ProseMax" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {/* 1) Customer Factors */}
        <article className="panel glass panel-compact">
          <PanelHead title="Customer Factors" subtitle="Adjust to see real-time KPI impact" />
          <div className="form-grid" style={{ gap: 8 }}>
            <FactorSlider label="AOV" unit="$" min={20} max={500} step={5} value={factors.aov} onChange={(v)=>setFactors({ aov:v })} />
            <FactorSlider label="CAC" unit="$" min={20} max={500} step={5} value={factors.cac} onChange={(v)=>setFactors({ cac:v })} />
            <FactorSlider label="Conversion" unit="%" min={0.5} max={10} step={0.1} value={factors.conversion*100} onChange={(v)=>setFactors({ conversion:v/100 })} />
            <FactorSlider label="Churn (monthly)" unit="%" min={0} max={10} step={0.1} value={factors.churn*100} onChange={(v)=>setFactors({ churn:v/100 })} />
            <FactorSlider label="Gross Margin" unit="%" min={20} max={90} step={1} value={factors.grossMargin*100} onChange={(v)=>setFactors({ grossMargin:v/100 })} />
            <FactorSlider label="DSO (days)" unit="d" min={10} max={120} step={5} value={factors.dsoDays} onChange={(v)=>setFactors({ dsoDays:v })} />
            <FactorSlider label="Growth Rate" unit="%" min={0} max={100} step={1} value={factors.growthRate*100} onChange={(v)=>setFactors({ growthRate:v/100 })} />
            <Toggle label="Seasonality" checked={factors.seasonality} onChange={(v)=>setFactors({ seasonality:v })} />
          </div>
        </article>

        {/* 2) Advanced: Preferred Stock — controls ONLY (no graphs here) */}
        <article className="panel glass panel-compact">
          <PanelHead title="Advanced: Preferred Stock" subtitle="Configure liquidation preferences" />
          <div className="row" style={{ margin: "4px 0" }}>
            <Toggle label="Enable Preferred" checked={preferred.enabled} onChange={(v)=>setPreferred({ enabled:v })} />
          </div>
          <div className="row two" style={{ gap: 8 }}>
            <Select label="Type" value={preferred.type} disabled={!preferred.enabled}
              onChange={(v)=>setPreferred({ type:v })}
              options={[
                { label:"Non-participating", value:"non-participating" },
                { label:"Participating", value:"participating" },
              ]}
            />
            <Select label="Multiple" value={String(preferred.multiple)} disabled={!preferred.enabled}
              onChange={(v)=>setPreferred({ multiple:Number(v) })}
              options={[
                { label:"1x", value:"1" },
                { label:"1.5x", value:"1.5" },
                { label:"2x", value:"2" },
              ]}
            />
          </div>
          <div className="row two" style={{ gap: 8 }}>
            <Select label="Cap" value={preferred.cap ? String(preferred.cap) : ""} disabled={!preferred.enabled || preferred.type!=="participating"}
              onChange={(v)=>setPreferred({ cap:v ? Number(v) : null })}
              options={[
                { label:"None", value:"" },
                { label:"2x cap", value:"2" },
                { label:"3x cap", value:"3" },
              ]}
            />
            <Select label="Seniority" value={preferred.seniority} disabled={!preferred.enabled}
              onChange={(v)=>setPreferred({ seniority:v })}
              options={[
                { label:"Standard", value:"standard" },
                { label:"Pari passu", value:"pari-passu" },
              ]}
            />
          </div>
        </article>

        {/* 3) What changed and why */}
        <article className="panel glass panel-compact">
          <PanelHead title="What changed and why?" subtitle="Short explanations of KPI movements" />
          <ExplainList
            revenue={revenue}
            ebitda={ebitda}
            dscrVal={dscrVal}
            minDSCR={debtTerms?.minDSCR}
            dilution={dilution}
          />
        </article>
      </section>

      {/* ROW 2: full-width Exit focus template (controls + focused bar, and the full list if you want it here) */}
      <section className="ProseMax" style={{ marginTop: 12 }}>
        <article className="panel glass panel-compact">
          <PanelHead title="Exit focus" subtitle="Adjust exit and view investor vs common under current terms" />

          <div className="row two" style={{ alignItems: "center", gap: 8 }}>
            <div>
              <FactorSlider
                label="Exit (focus)"
                unit="$M"
                min={5}
                max={50}
                step={5}
                value={exitMid/1_000_000}
                onChange={(v)=>setExitMid(v*1_000_000)}
              />
            </div>
            <div>
              <Toggle
                label="Enable Preferred (quick toggle)"
                checked={preferred.enabled}
                onChange={(v)=>setPreferred({ enabled:v })}
              />
            </div>
          </div>

          {equityTerms ? (
            <>
              {/* Focused single-exit stacked bar */}
              <ExitFocusBar
                exit={exitMid}
                invested={equityTerms.raise}
                asConvertedPct={equityTerms.soldPct}
                preferred={preferred}
              />
              {/* If you want the full multi-exit list only here, keep the next line.
                  If you want focused bar ONLY, delete the next <WaterfallBars/>. */}
              <WaterfallBars points={wfPoints} focus={exitMid} />
            </>
          ) : (
            <p className="muted small" style={{ marginTop: 6 }}>
              Select an equity scenario in the tree to view payouts at the focused exit.
            </p>
          )}
        </article>
      </section>
    </div>
  );
}

/* Helpers */

function KPI({ label, value, tone = "neutral" }) {
  return (
    <div className={`kpi ${tone}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}

function PanelHead({ title, subtitle }) {
  return (
    <div className="panel-head">
      <h3 style={{ marginBottom: 2 }}>{title}</h3>
      {subtitle && <p className="muted small" style={{ marginTop: 0 }}>{subtitle}</p>}
    </div>
  );
}

function FactorSlider({ label, unit, min, max, step, value, onChange }) {
  return (
    <label className="field">
      <div className="field-top">
        <span>{label}</span>
        <strong>{formatValue(value, unit)}</strong>
      </div>
      <input
        className="range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e)=>onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e)=>onChange(e.target.checked)} />
      <span className="track"><span className="thumb" /></span>
      <span className="t-label">{label}</span>
    </label>
  );
}

function Select({ label, value, onChange, options, disabled }) {
  return (
    <label className={`select ${disabled ? "is-disabled" : ""}`}>
      <span className="s-label">{label}</span>
      <div className="s-wrap">
        <select value={value} onChange={(e)=>onChange(e.target.value)} disabled={disabled}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </label>
  );
}

/* Focused single-exit stacked bar */
function ExitFocusBar({ exit, invested, asConvertedPct, preferred }) {
  if (!exit || !invested || asConvertedPct == null) return null;
  const { investorPayout, commonPayout } = preferredWaterfallSingleRound(
    exit, invested, asConvertedPct, preferred
  );
  const total = Math.max(1, investorPayout + commonPayout);
  const invPct = (investorPayout / total) * 100;
  const comPct = 100 - invPct;

  return (
    <div className="wf" style={{ marginTop: 6 }}>
      <div className="wf-legend">
        <span className="dot investor" /> Investor
        <span className="dot common" /> Common
      </div>
      <div className="wf-row focus">
        <div className="wf-exit">${(exit/1_000_000).toFixed(0)}M</div>
        <div className="wf-bar" style={{ width: "100%" }}>
          <span className="seg investor" style={{ width: `${invPct}%` }} />
          <span className="seg common" style={{ width: `${comPct}%` }} />
        </div>
      </div>
      <div className="small muted" style={{ marginTop: 6 }}>
        Investor: ${Math.round(investorPayout).toLocaleString()} — Common: ${Math.round(commonPayout).toLocaleString()}
      </div>
    </div>
  );
}

/* Full multi-exit list (now only in the 4th template, unless you remove it there) */
function WaterfallBars({ points, focus }) {
  if (!points.length) return null;
  const maxExit = Math.max(...points.map(p=>p.exit), 1);
  return (
    <div className="wf">
      <div className="wf-legend">
        <span className="dot investor" /> Investor
        <span className="dot common" /> Common
      </div>
      <div className="wf-list">
        {points.map(p => {
          const pct = Math.max(8, Math.round((p.exit / maxExit) * 100));
          const isFocus = p.exit === focus;
          const total = p.investor + p.common || 1;
          const invPct = (p.investor / total) * 100;
          const comPct = 100 - invPct;
          return (
            <div key={p.exit} className={`wf-row ${isFocus ? "focus" : ""}`}>
              <div className="wf-exit">${(p.exit/1_000_000).toFixed(0)}M</div>
              <div className="wf-bar" style={{ width: `${pct}%` }}>
                <span className="seg investor" style={{ width: `${invPct}%` }} />
                <span className="seg common" style={{ width: `${comPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExplainList({ revenue, ebitda, dscrVal, minDSCR, dilution }) {
  return (
    <ul className="explain">
      <li>
        <span className="dot info" />
        Revenue and EBITDA update from AOV, CAC, conversion, churn, margin, and growth sliders.
      </li>
      {dscrVal !== undefined && (
        <li>
          <span className={`dot ${dscrVal >= (minDSCR ?? 1.2) ? "good" : "bad"}`} />
          DSCR={dscrVal.toFixed(2)} vs target {(minDSCR ?? 1.2).toFixed(1)}x.
        </li>
      )}
      {dilution !== undefined && (
        <li>
          <span className="dot warn" />
          Dilution reflects sold% in the selected round and drives exit payouts.
        </li>
      )}
      <li>
        <span className="dot emerald" />
        Preferred terms (multiple, participating, caps) shape mid‑range exits.
      </li>
    </ul>
  );
}

function formatValue(v, unit) {
  if (unit === "$M") return `${v}${unit}`;
  if (unit === "$") return `$${v}`;
  if (unit === "d") return `${v}${unit}`;
  if (unit === "%") return `${v}${unit}`;
  return `${v}${unit ?? ""}`;
}
