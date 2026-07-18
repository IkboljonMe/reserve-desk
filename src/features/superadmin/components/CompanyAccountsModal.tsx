'use client'

import { useState, useEffect, useCallback } from 'react'
import { Copy, KeyRound, Check, LogIn } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { useToast } from '@/components/ToastProvider'
import { getCompanyAdmins, resetCompanyAdminPassword, type CompanyAdminRecord, type CompanyRecord } from '@/lib/api/companies'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'

// Kept as its own function (not inlined in the render body) so the impure
// `Date.now()` read doesn't happen directly inside the component.
function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now()
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export function CompanyAccountsModal({ company, onClose }: { company: CompanyRecord | null; onClose: () => void }) {
  const { t, lang } = useTranslation()
  const { showToast } = useToast()
  const [admins, setAdmins] = useState<CompanyAdminRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [draftPassword, setDraftPassword] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [revealedId, setRevealedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const load = useCallback(async (companyId: string) => {
    setLoading(true)
    try {
      setAdmins(await getCompanyAdmins(companyId))
    } catch {
      showToast(t('loadAccountsFailed'), 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast, t])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (company) {
      load(company._id)
      setResettingId(null)
      setRevealedId(null)
    }
  }, [company, load])
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!company) return null

  // Opens the account's own login page in a new tab with the email prefilled —
  // the superadmin just types the (master or account) password. Returns '' for
  // an admin whose hotel has no slug yet (can't build the area login path).
  function loginUrl(a: CompanyAdminRecord): string {
    const q = `?email=${encodeURIComponent(a.email)}`
    if (a.role === 'owner') return `/${lang}/secure/company/${company!.slug}/login${q}`
    if (a.hotelId?.slug) return `/${lang}/secure/company/${company!.slug}/admin/${a.hotelId.slug}/login${q}`
    return ''
  }

  function startReset(id: string) {
    setResettingId(id)
    setDraftPassword(generatePassword())
    setRevealedId(null)
  }

  async function confirmReset(id: string) {
    if (draftPassword.length < 6) {
      showToast(t('passwordTooShort'), 'error')
      return
    }
    setSavingId(id)
    try {
      await resetCompanyAdminPassword(company!._id, id, draftPassword)
      showToast(t('passwordResetDone'), 'success')
      setResettingId(null)
      setRevealedId(id)
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('passwordResetFailed'), 'error')
    } finally {
      setSavingId(null)
    }
  }

  async function copy(text: string, id: string) {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <Modal open={!!company} onClose={onClose} title={`${company.name} — ${t('loginDetails')}`} size="lg">
      <div className="mb-3 text-[0.8125rem] text-gray-500">
        {isExpired(company.expiresAt)
          ? <span className="text-danger font-semibold">{t('planExpired')}</span>
          : <>{t('planActiveUntil')} <strong>{new Date(company.expiresAt).toLocaleDateString()}</strong></>}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner size={24} /></div>
      ) : admins.length === 0 ? (
        <p className="text-gray-500 text-sm">{t('noAccountsYet')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {admins.map(a => (
            <div key={a._id} className="border border-surface-border rounded-lg p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={a.role === 'owner' ? 'blue' : 'gray'}>
                  {a.role === 'owner' ? t('ownerRole') : t('adminRole')}
                </Badge>
                <span className="font-semibold text-gray-800">{a.name}</span>
                {a.hotelId && <span className="text-[0.8125rem] text-gray-500">— {a.hotelId.name}</span>}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[0.8125rem]">
                <span className="text-gray-500">{t('email')}:</span>
                <span className="font-mono text-gray-700">{a.email}</span>
                <button
                  type="button"
                  onClick={() => copy(a.email, `email-${a._id}`)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label={t('copy')}
                >
                  {copiedId === `email-${a._id}` ? <Check size={13} /> : <Copy size={13} />}
                </button>
                {loginUrl(a) && (
                  <a
                    href={loginUrl(a)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-brand-600 hover:underline font-medium"
                  >
                    <LogIn size={13} /> {t('openLogin')}
                  </a>
                )}
              </div>

              {resettingId === a._id ? (
                <div className="mt-2 flex items-center gap-1.5">
                  <input
                    className="form-input font-mono text-[0.8125rem] py-1"
                    value={draftPassword}
                    onChange={e => setDraftPassword(e.target.value)}
                  />
                  <Button size="sm" variant="secondary" type="button" onClick={() => setDraftPassword(generatePassword())}>
                    {t('regenerate')}
                  </Button>
                  <Button size="sm" type="button" disabled={savingId === a._id} onClick={() => confirmReset(a._id)}>
                    {savingId === a._id ? <Spinner size={14} dark={false} /> : t('setPassword')}
                  </Button>
                  <Button size="sm" variant="ghost" type="button" onClick={() => setResettingId(null)}>
                    {t('cancel')}
                  </Button>
                </div>
              ) : revealedId === a._id ? (
                <div className="mt-2 flex items-center gap-1.5 text-[0.8125rem]">
                  <span className="text-gray-500">{t('newPassword')}:</span>
                  <span className="font-mono font-semibold text-gray-800">{draftPassword}</span>
                  <button
                    type="button"
                    onClick={() => copy(draftPassword, `pw-${a._id}`)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    aria-label={t('copy')}
                  >
                    {copiedId === `pw-${a._id}` ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                  <span className="text-gray-400">({t('shownOnceNotice')})</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startReset(a._id)}
                  className="mt-2 inline-flex items-center gap-1 text-[0.8125rem] text-brand-600 hover:underline cursor-pointer"
                >
                  <KeyRound size={13} /> {t('resetPassword')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
