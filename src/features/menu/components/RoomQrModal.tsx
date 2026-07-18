'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import { Download } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useTranslation } from '@/i18n'

interface RoomLite {
  _id: string
  hotelId: string
  number: string
}

// A4, 2 QR codes per row / 2 rows per page (4 per page) — big enough to scan
// comfortably once printed and cut apart.
const COLS = 2
const ROWS_PER_PAGE = 2
const CELL_W = 90
const CELL_H = 130
const MARGIN_X = 15
const MARGIN_Y = 15

export function RoomQrModal({
  open, onClose, hotelId, hotelName, hotelSlug,
}: {
  open: boolean
  onClose: () => void
  hotelId: string
  hotelName: string
  hotelSlug?: string
}) {
  const { t, lang } = useTranslation()
  const pathname = usePathname()
  const [rooms, setRooms] = useState<RoomLite[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data load
    setLoading(true)
    fetch('/api/rooms')
      .then(r => r.json())
      .then((all: RoomLite[]) => setRooms(Array.isArray(all) ? all.filter(r => r.hotelId === hotelId) : []))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false))
  }, [open, hotelId])

  // The dashboard is reached at /secure/company/<slug>/... regardless of
  // owner vs admin — the guest menu lives on that company's own subdomain.
  const companySlug = useMemo(() => {
    const m = pathname.match(/\/secure\/company\/([^/]+)/)
    return m ? m[1] : ''
  }, [pathname])

  function roomUrl(roomNumber: string): string {
    if (typeof window === 'undefined') return ''
    const baseDomain = window.location.host.replace(/^(www|app|admin|super|demo)\./, '')
    const params = `hotel=${encodeURIComponent(hotelSlug || '')}&room=${encodeURIComponent(roomNumber)}`
    return `${window.location.protocol}//${companySlug}.${baseDomain}/${lang}/menu?${params}`
  }

  const canGenerate = !!hotelSlug && !!companySlug && rooms.length > 0

  async function downloadPdf() {
    setGenerating(true)
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const perPage = COLS * ROWS_PER_PAGE

      for (let i = 0; i < rooms.length; i++) {
        const posOnPage = i % perPage
        if (i > 0 && posOnPage === 0) doc.addPage()
        const col = posOnPage % COLS
        const row = Math.floor(posOnPage / COLS)
        const x = MARGIN_X + col * CELL_W
        const y = MARGIN_Y + row * CELL_H

        const dataUrl = await QRCode.toDataURL(roomUrl(rooms[i].number), { width: 400, margin: 1 })

        doc.setFontSize(13)
        doc.text(`${hotelName} · ${t('room')} ${rooms[i].number}`, x + CELL_W / 2, y + 8, { align: 'center' })
        doc.addImage(dataUrl, 'PNG', x + (CELL_W - 75) / 2, y + 14, 75, 75)
        doc.setFontSize(10)
        doc.text(t('scanToOrder'), x + CELL_W / 2, y + 96, { align: 'center' })
      }

      doc.save(`${hotelSlug || hotelName}-qr-codes.pdf`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('qrCodesTitle')}
      size="lg"
      closeLabel={t('close')}
      footer={
        <Button className="w-full justify-center" leftIcon={<Download size={15} />} loading={generating} disabled={!canGenerate} onClick={downloadPdf}>
          {generating ? t('generatingPdf') : t('downloadPdf')}
        </Button>
      }
    >
      <p className="text-sm text-[var(--gray-500)] mb-4">{t('qrCodesDesc')}</p>
      {loading ? (
        <p className="text-center text-[var(--gray-400)] py-8">{t('loading')}</p>
      ) : !hotelSlug ? (
        <p className="text-center text-[var(--color-danger)] text-sm py-8">{t('hotelNeedsSlugForQr')}</p>
      ) : rooms.length === 0 ? (
        <p className="text-center text-[var(--gray-400)] text-sm py-8">{t('noRoomsForQr')}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {rooms.map(room => (
            <div key={room._id} className="flex flex-col items-center gap-2 border border-[var(--surface-border)] rounded-xl p-3">
              <QRCodeSVG value={roomUrl(room.number)} size={100} />
              <span className="text-sm font-bold text-[var(--gray-800)]">{t('room')} {room.number}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
