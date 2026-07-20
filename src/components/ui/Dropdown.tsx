"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  ariaLabel?: string;
  containerClassName?: string;
}

export default function Dropdown({
  value,
  onChange,
  options,
  label,
  placeholder = "Select…",
  error,
  disabled = false,
  icon,
  ariaLabel,
  containerClassName = "",
}: DropdownProps) {
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
    if (disabled) return;
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
    if (disabled) return;
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
    <div
      ref={rootRef}
      className={`flex flex-col gap-1.5 w-full relative box-border ${containerClassName}`.trim()}
    >
      {label && (
        <span className="text-[0.8125rem] font-semibold text-[var(--gray-700,#374151)] tracking-tight">
          {label}
        </span>
      )}

      <div className="relative w-full">
        <button
          type="button"
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={ariaLabel || label}
          aria-activedescendant={
            open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
          }
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[40px] border border-[var(--surface-border)] rounded-lg bg-[var(--surface-card)] text-[0.8125rem] font-medium text-[--gray-800] cursor-pointer outline-none text-left transition-all duration-150 box-border hover:not-disabled:border-[var(--gray-400)] focus-visible:border-[var(--brand-500,#6366f1)] focus-visible:shadow-[0_0_0_3px_rgba(99,102,241,0.14)] disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-[var(--gray-50)] ${
            open
              ? "border-[var(--brand-500,#6366f1)] ring-2 ring-[var(--brand-500)]/15 shadow-sm"
              : ""
          } ${error ? "border-[var(--color-danger,#ef4444)] focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.14)]" : ""}`}
        >
          {icon && (
            <span className="inline-flex shrink-0 text-[var(--brand-600)]">
              {icon}
            </span>
          )}
          <span
            className={`flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${
              selected && selected.value
                ? "text-[--gray-900] font-semibold"
                : "text-[var(--gray-400)]"
            }`}
          >
            {selected && selected.value ? selected.label : placeholder}
          </span>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`shrink-0 text-[var(--gray-400)] transition-transform duration-150 ease-out ${
              open ? "rotate-180 text-[var(--brand-500)]" : "rotate-0"
            }`}
          />
        </button>

        {open && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            className="absolute top-[calc(100%+6px)] left-0 right-0 z-[9999] list-none m-0 p-1.5 bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.04)] max-h-[240px] overflow-y-auto box-border"
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
                  className={`flex items-center justify-between gap-2 p-2 rounded-md cursor-pointer text-[0.8125rem] transition-all duration-100 ease-in-out box-border ${
                    isSelected
                      ? "font-bold text-[var(--brand-600,#4f6ef7)] bg-[var(--brand-50)]/30 dark:bg-[var(--brand-500)]/15 hover:bg-[var(--brand-50)]/50"
                      : "text-[var(--gray-700)] hover:bg-[var(--gray-50)] hover:text-[--gray-900]"
                  } ${isActive && !isSelected ? "bg-(--gray-100) text-[--gray-900]" : ""}`}
                >
                  <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                    {opt.label}
                  </span>
                  {isSelected && (
                    <Check
                      size={15}
                      aria-hidden="true"
                      className="shrink-0 text-[var(--brand-500)]"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {error && (
        <span className="text-[0.75rem] text-[var(--color-danger,#ef4444)] font-medium">
          {error}
        </span>
      )}
    </div>
  );
}
