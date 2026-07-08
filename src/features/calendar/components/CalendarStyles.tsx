'use client'

// Scoped styles for the calendar's segmented controls, pills, events and icon buttons.
export function CalendarStyles() {
  return (
    <style>{`
      .cal-seg { display:inline-flex; background:var(--gray-100); border-radius:10px; padding:3px; gap:2px; }
      .cal-seg button { border:none; background:transparent; padding:5px 12px; border-radius:7px; font-size:0.8rem;
        font-weight:600; color:var(--gray-500); cursor:pointer; transition:all .15s; text-transform:capitalize; font-family:inherit; }
      .cal-seg button.active { background:#fff; color:var(--brand-700); box-shadow:var(--shadow-xs); }
      .cal-pill { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:999px;
        font-size:0.78rem; font-weight:600; cursor:pointer; border:1.5px solid var(--gray-200);
        background:var(--surface-card); color:var(--gray-600); transition:all .15s; font-family:inherit; white-space:nowrap; }
      .cal-pill:hover { border-color:var(--brand-400); color:var(--brand-700); }
      .cal-pill.active { background:var(--brand-gradient,var(--brand-500)); color:#fff; border-color:transparent; }
      .cal-event { position:absolute; border-radius:7px; overflow:hidden; cursor:pointer;
        transition:box-shadow .12s, transform .12s, filter .12s; box-sizing:border-box; }
      .cal-event:hover { box-shadow:0 6px 16px rgba(0,0,0,0.14); transform:translateY(-1px); z-index:5; filter:saturate(1.15); }
      .cal-icon-btn { display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px;
        border-radius:8px; border:1px solid var(--gray-200); background:var(--surface-card); color:var(--gray-600);
        cursor:pointer; transition:all .15s; }
      .cal-icon-btn:hover { border-color:var(--brand-400); color:var(--brand-600); background:var(--brand-50); }
    `}</style>
  )
}
