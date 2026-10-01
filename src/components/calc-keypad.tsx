"use client";

import { useEffect, useRef } from "react";
import { isOperator } from "@/lib/calc";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

// drawn as SVG: text glyphs sit on the font baseline and look low in the button
const OPS: { op: string; label: string; icon: React.ReactNode }[] = [
  { op: "+", label: "Add", icon: <path d="M12 5v14M5 12h14" /> },
  { op: "-", label: "Subtract", icon: <path d="M5 12h14" /> },
  { op: "*", label: "Multiply", icon: <path d="M7 7l10 10M17 7L7 17" /> },
  {
    op: "/",
    label: "Divide",
    icon: (
      <>
        <path d="M5 12h14" />
        <circle cx="12" cy="6.5" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="12" cy="17.5" r="1.6" fill="currentColor" stroke="none" />
      </>
    ),
  },
];

// Lets desktop viewers type digits and + − × ÷ on their real keyboard.
export function useCalcKeyboard(enabled: boolean, onKey: (key: string) => void) {
  const handler = useRef(onKey);
  useEffect(() => {
    handler.current = onKey;
  });

  useEffect(() => {
    if (!enabled) return;
    const listener = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const key = e.key === "Backspace" ? "⌫" : e.key === "x" || e.key === "X" ? "*" : e.key;
      if (/^[0-9.]$/.test(key) || isOperator(key) || key === "⌫") {
        e.preventDefault();
        handler.current(key);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [enabled]);
}

export function CalcKeypad({
  onKey,
  expr,
  compact = false,
}: {
  onKey: (key: string) => void;
  // the expression being edited, so the pending operator can light up
  expr: string;
  compact?: boolean;
}) {
  const lastOp = isOperator(expr.slice(-1)) ? expr.slice(-1) : null;
  const keyHeight = compact ? "h-11" : "h-12";

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 px-6 pb-1.5">
        {OPS.map(({ op, label, icon }) => (
          <button
            key={op}
            type="button"
            aria-label={label}
            onClick={() => onKey(op)}
            className={`flex ${compact ? "h-10" : "h-11"} items-center justify-center rounded-2xl transition-all active:scale-95 ${
              lastOp === op
                ? "bg-gradient-to-br from-primary to-secondary text-white shadow-md shadow-primary/25"
                : "bg-accent text-primary"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              {icon}
            </svg>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1 px-6 pb-2">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onKey(key)}
            className={`flex ${keyHeight} items-center justify-center rounded-2xl text-[19px] font-semibold text-foreground transition-colors active:bg-accent`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
