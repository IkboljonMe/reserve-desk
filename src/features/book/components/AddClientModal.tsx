'use client'

import { useTranslation } from '@/i18n'
import Spinner from '@/components/ui/Spinner'
import type { BookingWizard } from '../useBookingWizard'
import Button from '@/components/ui/Button'

// Lightweight "add client" modal used from within the booking wizard.
// The client group is already known from the plan section, so this only
// asks for what's needed to identify the guest.
export function AddClientModal({ w }: { w: BookingWizard }) {
  const { t } = useTranslation()
  const { addClientModalOpen, addClientForm, setAddClientForm, savingNewClient, closeAddClientModal, submitAddClient } = w
  if (!addClientModalOpen) return null

  return (
    // Nested inside the booking wizard modal — a higher z-index guarantees it
    // stacks above that modal regardless of any stacking context its own
    // open/close animation may be establishing at the moment this opens.
    <div className="modal-overlay" onClick={closeAddClientModal} style={{ zIndex: 110 }}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('addClient')}</h2>
          <Button type="button" variant="ghost" icon onClick={closeAddClientModal} aria-label={t('close')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </Button>
        </div>

        <form onSubmit={submitAddClient}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{t('fullName')} *</label>
              <input
                className="form-input" required autoFocus
                value={addClientForm.name}
                onChange={e => setAddClientForm(f => ({ ...f, name: e.target.value }))}
                placeholder={t('fullNamePlaceholder')}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('phone')}</label>
              <input
                className="form-input" type="tel"
                value={addClientForm.phone}
                onChange={e => setAddClientForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+998 90 123 45 67"
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('notes')}</label>
              <textarea
                className="form-textarea"
                value={addClientForm.notes}
                onChange={e => setAddClientForm(f => ({ ...f, notes: e.target.value }))}
                placeholder={t('notesClientPlaceholder')}
                style={{ minHeight: 72 }}
              />
            </div>
          </div>

          <div className="h-px bg-surface-border my-4" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button type="button" variant="secondary" onClick={closeAddClientModal}>{t('cancel')}</Button>
            <Button type="submit" disabled={savingNewClient || !addClientForm.name.trim()}>
              {savingNewClient ? <Spinner size={18} dark={false} /> : null}
              {savingNewClient ? t('saving') : t('addClient')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
