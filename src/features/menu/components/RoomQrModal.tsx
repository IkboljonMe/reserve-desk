"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { Download } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useTranslation } from "@/i18n";
import { publicHubUrl } from "@/lib/menu";

interface RoomLite {
  _id: string;
  hotelId: string;
  number: string;
}

// A4, 2 QR codes per row / 2 rows per page (4 per page) — big enough to scan
// comfortably once printed and cut apart.
const COLS = 2;
const ROWS_PER_PAGE = 2;
const CELL_W = 90;
const CELL_H = 130;
const MARGIN_X = 15;
const MARGIN_Y = 15;

export function RoomQrModal({
  open,
  onClose,
  hotelId,
  hotelName,
  hotelSlug,
}: {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  hotelName: string;
  hotelSlug?: string;
}) {
  const { t, lang } = useTranslation();
  const [generating, setGenerating] = useState(false);

  const roomsQuery = useQuery<RoomLite[]>({
    queryKey: ["rooms"],
    queryFn: () => fetch("/api/rooms").then((r) => r.json()),
    enabled: open,
  });
  const rooms = useMemo(
    () => (roomsQuery.data ?? []).filter((r) => r.hotelId === hotelId),
    [roomsQuery.data, hotelId],
  );
  const loading = roomsQuery.isLoading;

  // Guest hub is public on the menu subdomain:
  //   menu.bronit.uz/<locale>/<hotelSlug>?room=<roomNumber>
  function roomUrl(roomNumber: string): string {
    if (typeof window === "undefined") return "";
    return publicHubUrl(
      window.location.host,
      lang,
      hotelSlug || "",
      roomNumber,
      window.location.protocol,
    );
  }

  const canGenerate = !!hotelSlug && rooms.length > 0;

  async function downloadPdf() {
    setGenerating(true);
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const perPage = COLS * ROWS_PER_PAGE;

      for (let i = 0; i < rooms.length; i++) {
        const posOnPage = i % perPage;
        if (i > 0 && posOnPage === 0) doc.addPage();
        const col = posOnPage % COLS;
        const row = Math.floor(posOnPage / COLS);
        const x = MARGIN_X + col * CELL_W;
        const y = MARGIN_Y + row * CELL_H;

        const dataUrl = await QRCode.toDataURL(roomUrl(rooms[i].number), {
          width: 400,
          margin: 1,
        });

        doc.setFontSize(13);
        doc.text(
          `${hotelName} · ${t("room")} ${rooms[i].number}`,
          x + CELL_W / 2,
          y + 8,
          { align: "center" },
        );
        doc.addImage(dataUrl, "PNG", x + (CELL_W - 75) / 2, y + 14, 75, 75);
        doc.setFontSize(10);
        doc.text(t("scanToOrder"), x + CELL_W / 2, y + 96, { align: "center" });
      }

      doc.save(`${hotelSlug || hotelName}-qr-codes.pdf`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("qrCodesTitle")}
      size="lg"
      closeLabel={t("close")}
      footer={
        <Button
          className="w-full justify-center"
          leftIcon={<Download size={15} />}
          loading={generating}
          disabled={!canGenerate}
          onClick={downloadPdf}
        >
          {generating ? t("generatingPdf") : t("downloadPdf")}
        </Button>
      }
    >
      <p className="text-sm text-[--gray-500] mb-4">{t("qrCodesDesc")}</p>
      {loading ? (
        <p className="text-center text-(--gray-400) py-8">{t("loading")}</p>
      ) : !hotelSlug ? (
        <p className="text-center text-[var(--color-danger)] text-sm py-8">
          {t("hotelNeedsSlugForQr")}
        </p>
      ) : rooms.length === 0 ? (
        <p className="text-center text-(--gray-400) text-sm py-8">
          {t("noRoomsForQr")}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {rooms.map((room) => (
            <div
              key={room._id}
              className="flex flex-col items-center gap-2 border border-(--surface-border) rounded-xl p-3"
            >
              <QRCodeSVG value={roomUrl(room.number)} size={100} />
              <span className="text-sm font-bold text-[--gray-800]">
                {t("room")} {room.number}
              </span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
