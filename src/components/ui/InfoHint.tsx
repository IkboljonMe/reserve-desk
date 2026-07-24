"use client";

import { useState, useId } from "react";
import { Info } from "lucide-react";

// A small "i" icon that reveals a help tooltip on hover/focus (and toggles on
// click for touch). Used next to form-field labels so admins can read what a
// field is for.
export function InfoHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className="relative inline-flex ml-1.25 align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={text}
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        className="inline-flex items-center justify-center w-4 h-4 p-0 border-none bg-none cursor-help text-(--gray-400)"
      >
        <Info size={13} />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 z-50 w-max max-w-60 bg-[#1f2937] text-white text-[0.72rem] font-normal leading-snug px-2.25 py-1.5 shadow-[0_6px_18px_rgba(0,0,0,0.22)] whitespace-normal text-left pointer-events-none"
        >
          {text}
        </span>
      )}
    </span>
  );
}

export default InfoHint;
