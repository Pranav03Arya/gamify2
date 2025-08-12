// src/App.tsx
import React from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import HomePage from "./pages/HomePage.tsx";
import TreePage from "./pages/TreePage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import { useSession } from "./state/sessionStore.ts";

export default function App() {
  const { mode, setMode } = useSession();
  const nav = useNavigate();
  const loc = useLocation();

  const goHome = () => { setMode("home"); nav("/"); };
  const goTree = (m) => { setMode(m); nav("/tree"); };
  const goDash = () => { setMode("dashboard"); nav("/dashboard"); };

  return (
    <div>
      <nav className="topbar">
        <button className="brand" onClick={goHome}>
          Debt vs. Equity Simulator
        </button>
        <div className="nav-actions">
          <button className="nav-link" onClick={() => goTree("explore")}>Explore</button>
          <button className="nav-link" onClick={() => goTree("guided")}>Guided</button>
          <button className="nav-link" onClick={goDash}>Dashboard</button>
        </div>
      </nav>

      <div className={`route ${loc.pathname === "/dashboard" ? "route-dashboard" : ""}`}>
        <Routes>
          <Route path="/" element={<HomePage onStartGuided={() => goTree("guided")} onStartExplore={() => goTree("explore")} />} />
          <Route path="/tree" element={<TreePage onCompleteGuided={goDash} />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </div>
    </div>
  );
}
