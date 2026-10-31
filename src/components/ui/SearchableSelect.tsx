"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

interface Props<T> {
  items: T[];
  value: string | null;
  onChange: (item: T | null) => void;
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  /** Small grey text under the label, e.g. department or PRN. Also searched. */
  getSubLabel?: (item: T) => string | undefined;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

/** One reusable dropdown with search. Use for faculty, subjects, sections, students... */
export function SearchableSelect<T>({
  items, value, onChange, getId, getLabel, getSubLabel,
  label, placeholder = "Search...", required, disabled,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => items.find((i) => getId(i) === value) ?? null, [items, value, getId]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 30);
    else setQ("");
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) => `${getLabel(i)} ${getSubLabel?.(i) ?? ""}`.toLowerCase().includes(s));
  }, [items, q, getLabel, getSubLabel]);

  return (
    <div className="relative w-full" ref={box}>
      {label && (
        <label className="mb-1 block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm shadow-sm hover:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        <span className={selected ? "text-slate-900" : "text-slate-400"}>
          {selected ? getLabel(selected) : placeholder}
        </span>
        <span className="flex items-center gap-1 text-slate-400">
          {selected && !disabled && (
            <X className="h-4 w-4 hover:text-slate-700" onClick={(e) => { e.stopPropagation(); onChange(null); }} />
          )}
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              className="w-full text-sm outline-none"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 && <li className="px-3 py-2 text-sm text-slate-400">No results</li>}
            {filtered.map((i) => {
              const id = getId(i);
              const active = id === value;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => { onChange(i); setOpen(false); }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 ${active ? "bg-slate-50" : ""}`}
                  >
                    <span>
                      <span className="block text-slate-900">{getLabel(i)}</span>
                      {getSubLabel?.(i) && <span className="block text-xs text-slate-500">{getSubLabel(i)}</span>}
                    </span>
                    {active && <Check className="h-4 w-4 text-blue-700" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
