'use client'

import { useTranslation } from '@/i18n'
import Button from '@/components/ui/Button'
import { Save } from 'lucide-react'
import type { useMenuSettings } from '../useMenuSettings'
import { TILE_META } from '@/lib/tiles'

type S = ReturnType<typeof useMenuSettings>

const FIELD = 'w-full px-3 py-2 min-h-[42px] rounded-lg text-sm outline-none bg-[var(--surface-card)] border border-[var(--surface-border)] text-[var(--gray-800)] focus:border-[var(--brand-500)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]'
const LABEL = 'block text-[0.8rem] font-semibold text-[var(--gray-600)] mb-1'
const SECTION = 'bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[var(--radius-lg)] p-5 flex flex-col gap-4'

export function MenuSettingsPanel({ s }: { s: S }) {
  const { t } = useTranslation()
  const { form, setField, toggleTile, save, saving } = s

  return (
    <div className="flex flex-col gap-5 max-w-2xl">

      {/* ── Branding ─────────────────────────────────────────── */}
      <section className={SECTION}>
        <h2 className="text-[1rem] font-bold text-[var(--gray-800)] m-0">{t('hubBranding')}</h2>

        <div>
          <label className={LABEL}>{t('bannerUrl')}</label>
          <input className={FIELD} value={form.bannerUrl} onChange={e => setField('bannerUrl', e.target.value)} placeholder="https://..." />
          {form.bannerUrl && (
            <img src={form.bannerUrl} alt="" className="mt-2 w-full h-24 object-cover rounded-lg" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
        </div>

        <div>
          <label className={LABEL}>{t('logoUrl')}</label>
          <input className={FIELD} value={form.logoUrl} onChange={e => setField('logoUrl', e.target.value)} placeholder="https://..." />
          {form.logoUrl && (
            <div className="mt-2 flex items-center gap-3">
              <img src={form.logoUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-[var(--surface-border)]" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
          )}
        </div>

        <div>
          <label className={LABEL}>{t('receptionPhone')}</label>
          <input className={FIELD} value={form.receptionPhone} onChange={e => setField('receptionPhone', e.target.value)} placeholder="+998 XX XXX XX XX" />
        </div>
      </section>

      {/* ── Wi-Fi ────────────────────────────────────────────── */}
      <section className={SECTION}>
        <h2 className="text-[1rem] font-bold text-[var(--gray-800)] m-0">{t('wifiSettings')}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>{t('wifiName')}</label>
            <input className={FIELD} value={form.wifiName} onChange={e => setField('wifiName', e.target.value)} placeholder="Network name" />
          </div>
          <div>
            <label className={LABEL}>{t('wifiPassword')}</label>
            <input className={FIELD} value={form.wifiPassword} onChange={e => setField('wifiPassword', e.target.value)} placeholder="Password" />
          </div>
        </div>
      </section>

      {/* ── Social & reviews ─────────────────────────────────── */}
      <section className={SECTION}>
        <h2 className="text-[1rem] font-bold text-[var(--gray-800)] m-0">{t('socialLinks')}</h2>
        <div>
          <label className={LABEL}>Instagram</label>
          <input className={FIELD} value={form.instagramUrl} onChange={e => setField('instagramUrl', e.target.value)} placeholder="https://instagram.com/..." />
        </div>
        <div>
          <label className={LABEL}>Telegram</label>
          <input className={FIELD} value={form.telegramUrl} onChange={e => setField('telegramUrl', e.target.value)} placeholder="https://t.me/..." />
        </div>
        <div>
          <label className={LABEL}>Google Maps</label>
          <input className={FIELD} value={form.googleMapsUrl} onChange={e => setField('googleMapsUrl', e.target.value)} placeholder="https://maps.google.com/..." />
        </div>
        <div>
          <label className={LABEL}>TripAdvisor</label>
          <input className={FIELD} value={form.tripadvisorUrl} onChange={e => setField('tripadvisorUrl', e.target.value)} placeholder="https://tripadvisor.com/..." />
        </div>
      </section>

      {/* ── Tiles ─────────────────────────────────────────────── */}
      <section className={SECTION}>
        <h2 className="text-[1rem] font-bold text-[var(--gray-800)] m-0">{t('tileSettings')}</h2>
        <p className="text-[0.8rem] text-[var(--gray-500)] m-0">{t('tileSettingsDesc')}</p>
        <div className="flex flex-col gap-2">
          {form.tiles.map((tile) => {
            const meta = TILE_META[tile.id]
            return (
              <div
                key={tile.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${tile.enabled ? 'border-[var(--brand-200)] bg-[var(--brand-50)]' : 'border-[var(--surface-border)] bg-transparent'}`}
              >
                <span className="text-[1.5rem] w-8 text-center shrink-0">{meta.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.85rem] font-semibold text-[var(--gray-800)]">{meta.label.uz}</div>
                  <div className="text-[0.72rem] text-[var(--gray-400)]">{meta.label.ru} · {meta.label.en}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={tile.enabled}
                    onChange={() => toggleTile(tile.id)}
                  />
                  <div className={`w-10 h-5.5 rounded-full transition-colors ${tile.enabled ? 'bg-[var(--brand-500)]' : 'bg-[var(--gray-300)]'}`}>
                    <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ml-0.5 ${tile.enabled ? 'translate-x-4.5' : 'translate-x-0'}`} />
                  </div>
                </label>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Save ─────────────────────────────────────────────── */}
      <Button
        leftIcon={<Save size={14} />}
        onClick={save}
        disabled={saving}
        className="self-start"
      >
        {saving ? t('saving') : t('save')}
      </Button>
    </div>
  )
}
