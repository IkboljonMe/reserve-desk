"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * A styled, accessible single-select dropdown (listbox pattern) that matches
 * the app's modal styling. Keeps focus on the trigger and drives the list via
 * aria-activedescendant, with full keyboard support.
 */
export default function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  icon,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value) || null;

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Keep the highlighted option scrolled into view.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const el = listRef.current?.children[activeIndex] as
      | HTMLElement
      | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function openList() {
    const idx = options.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 ? idx : 0);
    setOpen(true);
  }

  function choose(idx: number) {
    const opt = options[idx];
    if (opt) {
      onChange(opt.value);
      setOpen(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(activeIndex);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="w-full flex items-center gap-2.5 py-2.5 px-3 border-[1.5px] border-[var(--gray-200,#e5e7eb)] rounded-[10px] bg-[var(--surface-card)] font-sans text-[0.8125rem] font-medium text-[var(--gray-700,#374151)] cursor-pointer outline-none text-left transition-all duration-150 ease-in-out hover:border-[var(--gray-300,#d1d5db)] focus-visible:border-[var(--brand-500,#6366f1)] focus-visible:shadow-[0_0_0_3px_rgba(79,110,247,0.14)] aria-expanded:border-[var(--brand-500,#6366f1)] aria-expanded:shadow-[0_0_0_3px_rgba(79,110,247,0.14)]"
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-activedescendant={
          open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
        }
      >
        {icon && (
          <span className="inline-flex shrink-0 text-[var(--brand-600)]">
            {icon}
          </span>
        )}
        <span
          className={`flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${
            selected && selected.value
              ? "text-[--gray-800]"
              : "text-[var(--gray-400)]"
          }`}
        >
          {selected && selected.value ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-[var(--gray-400)] transition-transform duration-150 ease-out ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          className="absolute top-[calc(100%+6px)] left-0 right-0 z-20 list-none m-0 p-1 bg-white border border-[var(--gray-200,#e5e7eb)] rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-h-[240px] overflow-y-auto"
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isActive = idx === activeIndex;
            return (
              <li
                key={opt.value || "__placeholder"}
                id={`${listId}-${idx}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(idx);
                }}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-[0.8125rem] transition-colors duration-100 ease-in-out ${
                  isSelected
                    ? "font-semibold text-[var(--brand-700)] bg-[var(--brand-50)]"
                    : "text-[var(--gray-700)]"
                } ${isActive ? (isSelected ? "bg-[var(--brand-100)]" : "bg-(--gray-100)") : ""}`}
              >
                <span
                  className={`flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${
                    opt.value === "" ? "text-[var(--gray-400)]" : ""
                  }`}
                >
                  {opt.label}
                </span>
                {isSelected && (
                  <Check size={15} aria-hidden="true" className="shrink-0" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
