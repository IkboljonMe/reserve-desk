'use client'

import {
  Building2, Clock, Users, Pencil, Trash2, Check, X, Zap, BedDouble, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { useTranslation } from '@/i18n'
import { ServiceIcon } from '@/lib/serviceIcons'
import { Badge } from '@/components/ui/Badge'
import type { Service, PricingGroup } from '../types'
import Button from '@/components/ui/Button'

export function ServiceCard({
  svc,
  hotelName,
  onEdit,
  onToggleActive,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  deleteConfirm,
  groupMeta,
}: {
  svc: Service
  hotelName: string | undefined
  onEdit: () => void
  onToggleActive: () => void
  onDeleteRequest: () => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
  deleteConfirm: boolean
  groupMeta: (g: PricingGroup) => { label: string; color: string }
}) {
  const { t } = useTranslation()
  const hasPlans = svc.pricingPlans && svc.pricingPlans.length > 0
  const hasGroups = svc.pricingGroups && svc.pricingGroups.length > 0
  const hasBuffer = (svc.bufferTimeBefore ?? 0) > 0 || (svc.bufferTimeAfter ?? 0) > 0

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        borderTop: `3px solid ${svc.color}`,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = 'var(--shadow-md)'
        el.style.transform = 'translateY(-2px)'
        el.style.borderColor = svc.color
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = 'var(--shadow-sm)'
        el.style.transform = 'translateY(0)'
        el.style.borderColor = 'var(--surface-border)'
        el.style.borderTopColor = svc.color
      }}
    >
      {/* Card Header */}
      <div style={{ padding: '1.125rem 1.25rem 0.875rem', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `${svc.color}18`,
          border: `1.5px solid ${svc.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: svc.color,
        }}>
          <ServiceIcon name={svc.icon} serviceName={svc.name} size={22} strokeWidth={1.75} />
        </div>

        {/* Name + badges */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{
              fontWeight: 700, fontSize: '0.9375rem',
              color: 'var(--gray-800)', letterSpacing: '-0.01em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {svc.name}
            </span>
            {/* Status dot */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 20,
              fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.02em',
              background: svc.isActive ? '#ecfdf5' : 'var(--gray-100)',
              color: svc.isActive ? '#047857' : 'var(--gray-500)',
              border: `1px solid ${svc.isActive ? '#a7f3d0' : 'var(--gray-200)'}`,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: svc.isActive ? '#10b981' : 'var(--gray-400)',
                flexShrink: 0,
              }} />
              {svc.isActive ? t('active') : t('inactive')}
            </span>
          </div>

          {/* Hotel tag */}
          {hotelName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--gray-400)' }}>
              <Building2 size={11} />
              <span>{hotelName}</span>
              {(svc.sharedHotelIds?.length ?? 0) > 0 && (
                <span style={{ color: 'var(--brand-600)', fontWeight: 600 }}>
                  {t('plusNHotels', { count: svc.sharedHotelIds!.length })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick toggle */}
        <button
          onClick={onToggleActive}
          title={svc.isActive ? t('deactivate') : t('activate')}
          aria-label={svc.isActive ? t('deactivateService') : t('activateService')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: svc.isActive ? '#10b981' : 'var(--gray-300)',
            transition: 'color 0.15s ease',
            flexShrink: 0,
          }}
        >
          {svc.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
        </button>
      </div>

      {/* Description */}
      {svc.description && (
        <div style={{ padding: '0 1.25rem 0.75rem', fontSize: '0.775rem', color: 'var(--gray-500)', lineHeight: 1.5 }}>
          {svc.description}
        </div>
      )}

      {/* Pricing chips */}
      {hasPlans && (
        <div style={{ padding: '0 1.25rem 0.875rem', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {svc.pricingPlans!.map((plan, i) => (
            <span key={i} style={{
              background: `${svc.color}12`, color: svc.color,
              border: `1px solid ${svc.color}30`,
              padding: '3px 9px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
            }}>
              {plan.duration}m · {Number(plan.price).toLocaleString()} {t('sum')}
            </span>
          ))}
        </div>
      )}
      {svc.isFree && !hasPlans && (
        <div style={{ padding: '0 1.25rem 0.875rem' }}>
          <Badge variant="blue">{t('isFree')}</Badge>
        </div>
      )}

      {/* Category pricing summary */}
      {hasGroups && (
        <div style={{ padding: '0 1.25rem 0.875rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {svc.pricingGroups!.map((g, i) => {
            const meta = groupMeta(g)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: '0.68rem', fontWeight: 700, color: meta.color,
                }}>
                  {g.target === 'room' ? <BedDouble size={11} /> : <Users size={11} />}
                  {meta.label}
                </span>
                {g.rows.map((r, j) => (
                  <span key={j} style={{
                    background: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}30`,
                    padding: '2px 7px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600,
                  }}>
                    {r.duration}m · {Number(r.price).toLocaleString()}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Footer meta */}
      <div style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--surface-border)',
        padding: '0.625rem 1.25rem',
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--gray-50)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--gray-400)' }}>
          <Clock size={11} />
          {svc.openTime}–{svc.closeTime}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--gray-400)' }}>
          <Users size={11} />
          {svc.capacity}
        </span>
        {hasBuffer && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', color: 'var(--warning)' }}>
            <Zap size={10} />
            {svc.bufferTimeBefore || 0}+{svc.bufferTimeAfter || 0}m
          </span>
        )}

        {/* Action buttons pushed right */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
          {deleteConfirm ? (
            <>
              <Button
                variant="danger" icon
                onClick={onDeleteConfirm}
                aria-label={t('confirmDelete')}
              >
                <Check size={13} />
              </Button>
              <Button
                variant="ghost" icon
                onClick={onDeleteCancel}
                aria-label={t('cancelDelete')}
              >
                <X size={13} />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost" icon
                onClick={onEdit}
                title={t('edit')}
                aria-label={t('editNamed', { name: svc.name })}
              >
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost" icon
                onClick={onDeleteRequest}
                title={t('delete')}
                aria-label={t('deleteNamed', { name: svc.name })}
                style={{ color: 'var(--danger)' }}
              >
                <Trash2 size={14} />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
