'use client'

// Scoped styles for the services page: number-input arrow hiding, price input,
// filter pills and the responsive services grid.
export function ServicesStyles() {
  return (
    <style>{`
      .hide-arrows::-webkit-outer-spin-button,
      .hide-arrows::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      .hide-arrows[type=number] { -moz-appearance: textfield; }
      .price-input { font-variant-numeric: tabular-nums; letter-spacing: 2px; font-weight: 500; }
      .price-input::placeholder { letter-spacing: normal; font-weight: 400; }
      .svc-filter-pill {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;
        cursor: pointer; border: 1.5px solid var(--gray-200); background: var(--surface-card);
        color: var(--gray-600); transition: all 0.15s ease; white-space: nowrap;
        font-family: inherit;
      }
      .svc-filter-pill:hover { border-color: var(--brand-500); color: var(--brand-700); background: var(--brand-50); }
      .svc-filter-pill.active { background: var(--brand-gradient); color: #fff; border-color: transparent; box-shadow: var(--shadow-brand); }
      .services-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
      }
    `}</style>
  )
}
