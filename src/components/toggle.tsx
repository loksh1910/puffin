"use client";

import { motion } from "framer-motion";

export function Toggle({
  on,
  onChange,
  label,
  ariaLabel,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  // for when the visible label lives outside the switch
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={() => onChange(!on)}
      className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground"
    >
      {label}
      <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"}`}>
        <motion.span
          animate={{ x: on ? 18 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow"
        />
      </span>
    </button>
  );
}
