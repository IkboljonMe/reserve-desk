"use client";

// Opens the floating call-back / lead form (ContactWidget) from anywhere on the
// landing page by dispatching a window event the widget listens for. Used by the
// Custom plan's "Contact Us" CTA so a "talk to sales" click actually goes
// somewhere (posts a lead → pings admins on Telegram).
export const OPEN_CONTACT_EVENT = "bronit:open-contact";

export function OpenContactButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_CONTACT_EVENT))}
    >
      {children}
    </button>
  );
}
