"use client";

import { useState, useEffect } from "react";
import { X, PhoneCall } from "lucide-react";

interface Props {
  title: string;
  desc: string;
  namePlaceholder: string;
  phonePlaceholder: string;
  submitLabel: string;
  sendingLabel: string;
  successMsg: string;
  errorMsg: string;
  closeLabel: string;
}

type Status = "idle" | "sending" | "success" | "error";

// Call-back widget: a floating button that's always available (click to open,
// X to close). It also auto-opens once when the visitor reaches the bottom.
// Submitting posts to /api/leads, which pings admins on Telegram.
export function ContactWidget(p: Props) {
  const [open, setOpen] = useState(false);
  const [autoDone, setAutoDone] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (autoDone) return;
    const check = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 240;
      if (nearBottom) {
        setOpen(true);
        setAutoDone(true);
      }
    };
    const raf = requestAnimationFrame(check);
    window.addEventListener("scroll", check, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", check);
    };
  }, [autoDone]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="fixed right-5 bottom-5 z-[1200] w-14 h-14 rounded-full border-none cursor-pointer bg-[linear-gradient(135deg,#4f6ef7,#3b5bdb)] text-white shadow-[0_12px_30px_rgba(79,110,247,0.42)] inline-flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_16px_36px_rgba(79,110,247,0.5)]"
        onClick={() => setOpen(true)}
        aria-label={p.title}
      >
        <PhoneCall size={22} />
      </button>
    );
  }

  return (
    <div
      className="fixed right-5 bottom-5 z-[1200] w-[min(340px,calc(100vw-32px))] bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-[18px_18px_16px] animate-contact-in transition-colors duration-200"
      role="dialog"
      aria-label={p.title}
    >
      <button
        type="button"
        className="absolute top-2.5 right-2.5 w-7 h-7 border-none bg-(--gray-100) hover:bg-[var(--gray-200)] rounded-lg text-[var(--gray-500)] cursor-pointer inline-flex items-center justify-center transition-colors"
        onClick={() => setOpen(false)}
        aria-label={p.closeLabel}
      >
        <X size={16} />
      </button>

      {status === "success" ? (
        <div className="py-3 px-1 text-center text-sm font-semibold text-[--gray-900]">
          ✅ {p.successMsg}
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="flex items-center gap-2 text-[0.98rem] text-[--gray-900]">
            <span className="inline-flex w-7 h-7 rounded-lg items-center justify-center bg-[var(--brand-50)]/50 text-[var(--brand-500)] dark:text-white">
              <PhoneCall size={16} />
            </span>
            <strong>{p.title}</strong>
          </div>
          <p className="my-2 text-[0.82rem] text-[var(--gray-500)] leading-[1.5]">
            {p.desc}
          </p>
          <input
            className="w-full box-border px-3 py-2.5 mb-2 border border-[var(--surface-border)] bg-[--surface-bg] text-[--gray-900] placeholder:text-[var(--gray-400)] rounded-xl text-sm outline-none focus:border-[#4f6ef7] focus:shadow-[0_0_0_3px_rgba(79,110,247,0.14)] transition-colors"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={p.namePlaceholder}
            required
            maxLength={120}
          />
          <input
            className="w-full box-border px-3 py-2.5 mb-2 border border-[var(--surface-border)] bg-[--surface-bg] text-[--gray-900] placeholder:text-[var(--gray-400)] rounded-xl text-sm outline-none focus:border-[#4f6ef7] focus:shadow-[0_0_0_3px_rgba(79,110,247,0.14)] transition-colors"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={p.phonePlaceholder}
            type="tel"
            required
            maxLength={40}
          />
          {status === "error" && (
            <div className="text-[0.75rem] text-[var(--danger)] mb-2">
              {p.errorMsg}
            </div>
          )}
          <button
            className="w-full py-[11px] border-none rounded-xl bg-[linear-gradient(135deg,#4f6ef7,#3b5bdb)] text-white font-bold text-[0.9rem] cursor-pointer disabled:opacity-60 disabled:cursor-default"
            type="submit"
            disabled={status === "sending"}
          >
            {status === "sending" ? p.sendingLabel : p.submitLabel}
          </button>
        </form>
      )}
    </div>
  );
}
