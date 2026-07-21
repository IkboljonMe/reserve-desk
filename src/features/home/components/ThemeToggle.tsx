"use client";

import { useEffect, useRef, useState } from "react";
import { Sun, Moon, Laptop, ChevronDown, Check } from "lucide-react";
import { useTheme, type Theme } from "@/providers/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Laptop },
  ];

  const activeOption = options.find((o) => o.value === theme) || options[2];
  const ActiveIcon = activeOption.icon;

  return (
    <div ref={rootRef} className="relative inline-block text-left select-none">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Theme"
        className="w-9.5 sm:w-26.25 h-9.5 px-0 sm:px-3.5 justify-center sm:justify-between inline-flex items-center rounded-[10px] bg-(--gray-100) hover:bg-(--gray-200) text-(--gray-700) cursor-pointer border border-(--surface-border) transition-all duration-150 text-[0.8rem] font-semibold"
      >
        <span className="flex items-center gap-1.75">
          <ActiveIcon size={14} className="shrink-0" />
          <span className="hidden sm:inline">{activeOption.label}</span>
        </span>
        <ChevronDown
          size={12}
          className={`hidden sm:block shrink-0 text-(--gray-400) transition-transform duration-150 ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>

      {open && (
        <ul className="absolute top-[calc(100%+6px)] right-0 z-9999 list-none m-0 p-1 bg-(--surface-card) border border-(--surface-border) rounded-[10px] shadow-[0_12px_32px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.04)] w-30 box-border">
          {options.map((opt) => {
            const isSelected = opt.value === theme;
            const OptIcon = opt.icon;
            return (
              <li
                key={opt.value}
                onClick={() => {
                  setTheme(opt.value);
                  setOpen(false);
                }}
                className={`flex items-center justify-between gap-2 p-2 rounded-lg cursor-pointer text-[0.8rem] transition-all duration-100 ease-in-out box-border ${
                  isSelected
                    ? "font-bold text-(--brand-600) bg-(--sidebar-hover)"
                    : "text-(--gray-700) hover:bg-(--gray-50) hover:text-(--gray-900)"
                }`}
              >
                <span className="flex items-center gap-1.75">
                  <OptIcon size={13} className="shrink-0" />
                  {opt.label}
                </span>
                {isSelected && (
                  <Check
                    size={13}
                    className="shrink-0 text-(--brand-500)"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
