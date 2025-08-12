import React from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  const startGuided = () => navigate("/tree", { state: { mode: "guided" } });
  const startExplore = () => navigate("/tree", { state: { mode: "explore" } });
  const openDashboard = () => navigate("/dashboard");

  return (
    <main className="home">
      {/* Hero */}
      <section className="hero ProseMax">
        <div className="hero-grid">
          <div className="hero-text">
            <h1 className="appear-up">
              Master <span className="accent">Financing Tradeoffs</span>
            </h1>
            <p className="subline appear-up delay-1">
              A hands-on simulator for walking debt vs. equity decisions and
              visualizing outcomes in an intuitive dashboard.
            </p>
            <div className="cta-row appear-up delay-2">
              <button className="btn btn-primary" onClick={startGuided}>
                Start Guided Maze <span className="arrow">→</span>
              </button>
              <button className="btn btn-ghost" onClick={startExplore}>
                Explore Freely
              </button>
              <button className="btn btn-soft" onClick={openDashboard}>
                Open Dashboard
              </button>
            </div>

            <ul className="badges appear-up delay-3" aria-label="Highlights">
              <li>Graduate-level</li>
              <li>Interactive</li>
              <li>Game-based learning</li>
            </ul>
          </div>

          <div className="hero-card appear-fade delay-2" aria-hidden="true">
            <div className="card glass">
              <div className="card-head">
                <span className="dot dot-debt" />
                <span className="dot dot-equity" />
                <span className="dot dot-outcome" />
              </div>
              <div className="card-body">
                <div className="mini-stats">
                  <div>
                    <div className="k">Dilution</div>
                    <div className="v">20%</div>
                  </div>
                  <div>
                    <div className="k">DSCR</div>
                    <div className="v good">1.6x</div>
                  </div>
                  <div>
                    <div className="k">Runway</div>
                    <div className="v">18m</div>
                  </div>
                </div>
                <div className="sparkline">
                  <span style={{ width: "14%" }} />
                  <span style={{ width: "28%" }} />
                  <span style={{ width: "36%" }} />
                  <span style={{ width: "48%" }} />
                  <span style={{ width: "62%" }} />
                  <span style={{ width: "78%" }} />
                </div>
                <div className="legend">
                  <span className="pill pill-debt">Debt</span>
                  <span className="pill pill-equity">Equity</span>
                  <span className="pill pill-outcome">Outcome</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blurs" aria-hidden="true" />
      </section>

      {/* Value Props */}
      <section className="features ProseMax">
        <div className="section-head">
          <h2>Why this simulator stands out</h2>
          <p className="muted">
            Clear structure, actionable comparisons, and a playful experience designed for
            serious learning.
          </p>
        </div>

        <div className="grid-3">
          <article className="feature-card hover-float">
            <div className="icon ring-blue">📊</div>
            <h3>Interactive Tree</h3>
            <p>Explore debt and equity paths with animated nodes and links, plus scenario outcomes.</p>
          </article>

          <article className="feature-card hover-float">
            <div className="icon ring-purple">🧭</div>
            <h3>Guided “Maze” Mode</h3>
            <p>Step-by-step walkthroughs highlight key decisions and ensure concepts click.</p>
          </article>

          <article className="feature-card hover-float">
            <div className="icon ring-emerald">🧮</div>
            <h3>Intuitive Dashboard</h3>
            <p>Adjust customer factors and preferred stock terms to see instant KPI changes.</p>
          </article>
        </div>
      </section>

      {/* Split highlight */}
      <section className="split ProseMax">
        <div className="split-card glass hover-lift">
          <div>
            <h3>Built for classrooms</h3>
            <p className="muted">
              Ideal for case discussions and solo practice—pin scenarios, compare outcomes, and
              explain the math behind each result.
            </p>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={startGuided}>
              Start Guided <span className="arrow">→</span>
            </button>
          </div>
        </div>
      </section>

     

      {/* Final CTA */}
      <section className="final-cta ProseMax">
        <div className="cta-slab glass hover-lift">
          <h3>Ready to explore?</h3>
          <p className="muted">Choose a mode below and dive into the decision tree. You can switch anytime.</p>
          <div className="cta-row">
            <button className="btn btn-primary" onClick={startGuided}>
              Guided Maze <span className="arrow">→</span>
            </button>
            <button className="btn btn-ghost" onClick={startExplore}>
              Explore Freely
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
