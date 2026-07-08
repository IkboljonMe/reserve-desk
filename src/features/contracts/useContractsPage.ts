'use client'

import { useState, useMemo, useEffect } from 'react'
import { useToast } from '@/components/ToastProvider'
import { getHotels } from '@/lib/api/hotels'
import { useTranslation } from '@/i18n'
import type { Contract, ContractStatus, ContractFormData } from './components/ContractModal'
import {
  useContractsQuery,
  useCreateContractMutation,
  useUpdateContractMutation,
  useDeleteContractMutation,
} from '@/hooks/useContracts'
import { daysLeftOf } from './utils'
import type { ExpiryFilter, SortKey } from './constants'

export function useContractsPage() {
  const { showToast } = useToast()
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | ContractStatus>('')
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('finishSoon')
  const [modalOpen, setModalOpen] = useState(false)
  const [editContract, setEditContract] = useState<Contract | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [hotels, setHotels] = useState<{ _id: string; name?: string; shortName: string }[]>([])

  // Hotels drive the owner's per-contract hotel picker (admins get just theirs).
  useEffect(() => { getHotels().then(h => setHotels(Array.isArray(h) ? h : [])).catch(() => {}) }, [])

  // Only the owner spans multiple hotels — then the list shows a Hotel column.
  const multiHotel = hotels.length > 1
  const hotelLabel = (id?: string) => {
    const h = hotels.find(x => x._id === id)
    return h ? (h.shortName || h.name || '—') : '—'
  }

  const { data: contracts = [], isLoading: loading } = useContractsQuery(search, statusFilter)

  const createMutation = useCreateContractMutation()
  const updateMutation = useUpdateContractMutation()
  const deleteMutation = useDeleteContractMutation()

  const saving = createMutation.isPending || updateMutation.isPending

  function openAdd() {
    setEditContract(null)
    setModalOpen(true)
  }

  function openEdit(c: Contract) {
    setEditContract(c)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditContract(null)
  }

  async function handleSave(form: ContractFormData) {
    if (!form.organizationName.trim()) return
    if (form.contractLink && !/^https?:\/\//i.test(form.contractLink)) {
      showToast(t('contractLinkInvalid'), 'error')
      return
    }
    try {
      if (editContract) {
        await updateMutation.mutateAsync({ id: editContract._id, data: form })
      } else {
        await createMutation.mutateAsync(form)
      }
      showToast(editContract ? t('contractUpdated') : t('contractAdded'), 'success')
      closeModal()
    } catch {
      showToast(t('saveContractFailed'), 'error')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id)
      showToast(t('contractDeleted'), 'success')
      setDeleteConfirm(null)
    } catch {
      showToast(t('deleteFailed'), 'error')
    }
  }

  // ---- Client-side derived filtering + sorting + stats ----
  const stats = useMemo(() => {
    let signed = 0, expiring = 0, expired = 0
    for (const c of contracts) {
      if (c.status === 'signed') signed++
      const dl = daysLeftOf(c.finishDate)
      if (c.status !== 'terminated' && dl !== null) {
        if (dl < 0) expired++
        else if (dl <= 30) expiring++
      }
    }
    return { total: contracts.length, signed, expiring, expired }
  }, [contracts])

  const visible = useMemo(() => {
    let list = contracts.filter(c => {
      const dl = daysLeftOf(c.finishDate)
      if (expiryFilter === 'expiring') return c.status !== 'terminated' && dl !== null && dl >= 0 && dl <= 30
      if (expiryFilter === 'expired') return c.status !== 'terminated' && dl !== null && dl < 0
      if (expiryFilter === 'active') return c.status !== 'terminated' && dl !== null && dl > 30
      return true
    })
    list = [...list].sort((a, b) => {
      const da = daysLeftOf(a.finishDate)
      const db = daysLeftOf(b.finishDate)
      switch (sortKey) {
        case 'finishSoon':
          if (da === null) return 1
          if (db === null) return -1
          return da - db
        case 'finishLate':
          if (da === null) return 1
          if (db === null) return -1
          return db - da
        case 'nameAsc':
          return a.organizationName.localeCompare(b.organizationName)
        case 'recent':
          return 0
        default:
          return 0
      }
    })
    return list
  }, [contracts, expiryFilter, sortKey])

  const activeFilterCount = (statusFilter ? 1 : 0) + (expiryFilter !== 'all' ? 1 : 0)

  return {
    search, setSearch, statusFilter, setStatusFilter, expiryFilter, setExpiryFilter,
    sortKey, setSortKey, modalOpen, editContract, deleteConfirm, setDeleteConfirm,
    hotels, multiHotel, hotelLabel, contracts, loading, saving,
    openAdd, openEdit, closeModal, handleSave, handleDelete,
    stats, visible, activeFilterCount,
  }
}

export type ContractsPageState = ReturnType<typeof useContractsPage>
