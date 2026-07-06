export default function GeneralSettingsPage() {
  return (
    <div className="card" style={{ maxWidth: 540 }}>
      <h2 style={{ marginBottom: '0.5rem' }}>General Settings</h2>
      <p style={{ marginBottom: '1.5rem' }}>Hotel-wide configuration options (coming soon).</p>

      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">Hotel Name</label>
        <input type="text" className="form-input" placeholder="Grand Hotel" disabled />
      </div>

      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Timezone</label>
        <select className="form-select" disabled>
          <option>UTC+0 – London</option>
          <option>UTC+1 – Paris</option>
          <option>UTC+2 – Athens</option>
        </select>
      </div>

      <div style={{
        background: 'var(--brand-50)',
        border: '1px solid var(--brand-100)',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: '0.8125rem',
        color: 'var(--brand-700)',
      }}>
        ℹ️ General settings will be configurable in a future update.
      </div>
    </div>
  )
}
