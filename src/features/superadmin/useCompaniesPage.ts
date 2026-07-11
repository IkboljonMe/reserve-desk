'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ToastProvider'
import { useTranslation } from '@/i18n'
import { getCompanies, saveCompany, deleteCompany, type CompanyRecord, type CompanyPlan } from '@/lib/api/companies'

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function defaultExpiry() {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

export const EMPTY_FORM = {
  name: '', slug: '', plan: 'standard' as CompanyPlan, expiresAt: defaultExpiry(),
  contactName: '', contactPhone: '', paymentMethod: '',
  ownerName: '', ownerEmail: '', ownerPassword: '',
}

export function useCompaniesPage() {
  const { showToast } = useToast()
  const { t } = useTranslation()
  const [companies, setCompanies] = useState<CompanyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editCompany, setEditCompany] = useState<CompanyRecord | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [slugTouched, setSlugTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      setCompanies(await getCompanies())
    } catch {
      showToast(t('loadCompaniesFailed'), 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast, t])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData() }, [loadData])

  function openAdd() {
    setEditCompany(null)
    setSlugTouched(false)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(c: CompanyRecord) {
    setEditCompany(c)
    setSlugTouched(true)
    setForm({
      ...EMPTY_FORM,
      name: c.name, slug: c.slug, plan: c.plan, expiresAt: c.expiresAt.slice(0, 10),
      contactName: c.contactName, contactPhone: c.contactPhone, paymentMethod: c.paymentMethod,
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditCompany(null)
    setForm(EMPTY_FORM)
  }

  function setName(name: string) {
    setForm(f => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }))
  }

  function setSlug(slug: string) {
    setSlugTouched(true)
    setForm(f => ({ ...f, slug: slugify(slug) }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.slug.trim() || !form.expiresAt) return
    if (!editCompany && (!form.ownerName.trim() || !form.ownerEmail.trim() || !form.ownerPassword)) return
    setSaving(true)
    try {
      await saveCompany(
        {
          name: form.name.trim(),
          slug: form.slug.trim(),
          plan: form.plan,
          expiresAt: form.expiresAt,
          contactName: form.contactName.trim(),
          contactPhone: form.contactPhone.trim(),
          paymentMethod: form.paymentMethod.trim(),
          ...(editCompany ? {} : {
            ownerName: form.ownerName.trim(),
            ownerEmail: form.ownerEmail.trim(),
            ownerPassword: form.ownerPassword,
          }),
        },
        editCompany?._id
      )
      showToast(editCompany ? t('companyUpdated') : t('companyAdded'), 'success')
      closeModal()
      loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('saveCompanyFailed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCompany(id)
      showToast(t('companyDeleted'), 'success')
      setDeleteConfirm(null)
      loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('deleteFailed'), 'error')
    }
  }

  return {
    companies, loading, modalOpen, editCompany, form, setForm, setName, setSlug, saving,
    deleteConfirm, setDeleteConfirm, openAdd, openEdit, closeModal, handleSave, handleDelete,
  }
}

export type CompaniesPageState = ReturnType<typeof useCompaniesPage>
