"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function FilterDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.id === value)?.label ?? "";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-all ${
          open ? "bg-accent text-primary ring-2 ring-primary/30" : "bg-muted text-foreground"
        }`}
      >
        <span className="text-muted-foreground">{label}:</span>
        {current}
        <motion.svg animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }} width="11" height="11" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-[150px] overflow-hidden rounded-2xl bg-card p-1.5 shadow-lg shadow-black/10 ring-1 ring-border"
            >
              {options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                    o.id === value ? "bg-accent text-primary" : "text-foreground active:bg-muted"
                  }`}
                >
                  {o.label}
                  {o.id === value && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
