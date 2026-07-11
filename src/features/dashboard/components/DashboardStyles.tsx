'use client'

// Scoped styles for the dashboard's pills, segmented controls, table headers and bars.
export function DashboardStyles() {
  return (
    <style>{`
      @keyframes barGrow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
      @keyframes barIn { from { height: 0; } }
      .dash-pill { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:999px;
        font-size:0.78rem; font-weight:600; cursor:pointer; border:1.5px solid var(--gray-200);
        background:var(--surface-card); color:var(--gray-600); transition:all .15s; font-family:inherit; white-space:nowrap; }
      .dash-pill:hover { border-color:var(--brand-400); color:var(--brand-700); }
      .dash-pill.active { background:var(--brand-500); color:#fff; border-color:transparent; }
      .dash-date-popover { position:absolute; top:calc(100% + 6px); left:0; z-index:9999;
        background:var(--white,#fff); border:1px solid var(--gray-200); border-radius:10px; padding:12px;
        box-shadow:0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); }
      .dash-th { padding:9px 12px; text-align:left; font-weight:700; color:var(--gray-500); font-size:0.7rem;
        text-transform:uppercase; letter-spacing:0.04em; white-space:nowrap; user-select:none; }
      .dash-row:hover { background:var(--brand-50) !important; }
      .bar-col:hover .bar-exp { filter:brightness(0.97); }

      /* Income analytics: chart + per-service breakdown side by side, stacking on narrow screens */
      .dash-analytics-grid { display:grid; grid-template-columns:minmax(0,1fr) 260px; gap:1.5rem; align-items:stretch; }
      .dash-analytics-side { border-left:1px solid var(--surface-border); padding-left:1.4rem; }
      @media (max-width: 860px) {
        .dash-analytics-grid { grid-template-columns:1fr; }
        .dash-analytics-side { border-left:none; border-top:1px solid var(--surface-border); padding-left:0; padding-top:1.1rem; }
      }

      /* Occupancy rows: name / bar / pct / hours, wrapping the label onto its own line on narrow screens */
      .dash-occ-row { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
      .dash-occ-name { width:130px; flex-shrink:0; }
      .dash-occ-bar { flex:1 1 100px; min-width:80px; }
      .dash-occ-hours { width:92px; flex-shrink:0; }
      @media (max-width: 480px) {
        .dash-occ-name { width:100%; }
        .dash-occ-hours { display:none; }
      }
    `}</style>
  )
}
