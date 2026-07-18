'use client'

import { useState } from 'react'
import { UserCog } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { useToast } from '@/components/ToastProvider'
import { updateSuperadminAccount } from '@/lib/api/superadmin'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

export default function MyAccountButton({ initialEmail }: { initialEmail: string }) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [email, setEmail] = useState(initialEmail)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  function openModal() {
    setEmail(initialEmail)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword && newPassword !== confirmPassword) {
      showToast(t('passwordsDontMatch'), 'error')
      return
    }
    setSaving(true)
    try {
      await updateSuperadminAccount({
        currentPassword,
        email: email.trim(),
        ...(newPassword ? { newPassword } : {}),
      })
      showToast(t('accountUpdated'), 'success')
      setOpen(false)
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('accountUpdateFailed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={openModal}
        leftIcon={<UserCog size={14} />}
        style={{ color: 'rgba(255,255,255,0.75)' }}
      >
        {t('myAccount')}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('myAccount')} size="sm">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            label={t('email')}
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <Input
            label={t('newPasswordOptional')}
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
          {newPassword && (
            <Input
              label={t('confirmNewPassword')}
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          )}
          <div className="h-px bg-surface-border" />
          <Input
            label={t('currentPasswordRequired')}
            type="password"
            required
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            helperText={t('currentPasswordHelp')}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>{t('cancel')}</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner size={18} dark={false} /> : null}
              {saving ? t('saving') : t('save')}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
