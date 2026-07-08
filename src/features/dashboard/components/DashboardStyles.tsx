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
      .dash-seg { display:inline-flex; background:var(--gray-100); border-radius:10px; padding:3px; gap:2px; }
      .dash-seg button { border:none; background:transparent; padding:5px 12px; border-radius:7px; font-size:0.8rem;
        font-weight:600; color:var(--gray-500); cursor:pointer; transition:all .15s; font-family:inherit; text-transform:capitalize; }
      .dash-seg button.active { background:#fff; color:var(--brand-700); box-shadow:var(--shadow-xs); }
      .dash-th { padding:9px 12px; text-align:left; font-weight:700; color:var(--gray-500); font-size:0.7rem;
        text-transform:uppercase; letter-spacing:0.04em; white-space:nowrap; user-select:none; }
      .dash-row:hover { background:var(--brand-50) !important; }
      .bar-col:hover .bar-exp { filter:brightness(0.97); }
    `}</style>
  )
}
