"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** Pinned footer (e.g. action buttons). Sits below the scrollable body. */
  footer?: ReactNode;
  /** Desktop max-width. On mobile the modal is always full-screen. */
  size?: "sm" | "md" | "lg";
  /** Hide the default header (title + close button). */
  hideHeader?: boolean;
  /** Override the scrollable body's classes (default padding). */
  bodyClassName?: string;
  /** aria-label for the close button. */
  closeLabel?: string;
}

const SIZE: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "sm:max-w-100",
  md: "sm:max-w-130",
  lg: "sm:max-w-170",
};

// Reusable modal. Full-bleed (w-full h-full) on mobile — a proper full-screen
// sheet — and a centered, rounded card from the `sm` breakpoint up. Themed via
// CSS variables so it works in light and dark. Closes on backdrop click or Esc,
// locks body scroll, and renders through a portal on <body>.
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  hideHeader,
  bodyClassName,
  closeLabel = "Close",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-2000 bg-slate-900/50 backdrop-blur-[6px] flex sm:items-center sm:justify-center sm:p-4 animate-[fadeIn_0.18s_ease]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`bg-(--surface-card) text-(--gray-800) flex flex-col w-full h-full sm:h-auto sm:max-h-[90dvh] sm:border sm:border-(--surface-border) sm:shadow-(--shadow-xl) animate-[slideUp_0.24s_cubic-bezier(0.16,1,0.3,1)] ${SIZE[size]}`}
      >
        {!hideHeader && (
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-(--surface-border) shrink-0">
            <h2 className="m-0 text-[1.05rem] font-bold text-(--gray-800)">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-(--gray-500) hover:bg-(--gray-100) cursor-pointer shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className={`flex-1 overflow-auto ${bodyClassName ?? "p-5"}`}>
          {children}
        </div>

        {footer && (
          <div className="px-5 py-4 border-t border-(--surface-border) shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
