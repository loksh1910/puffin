"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const NOTE_MAX = 40;

export type Suggestion = { emoji: string; label: string };

export const NOTE_SUGGESTIONS: Suggestion[] = [
  { emoji: "🍕", label: "Food" },
  { emoji: "🎬", label: "Movie" },
  { emoji: "🏠", label: "Rent" },
  { emoji: "🛒", label: "Groceries" },
  { emoji: "☕", label: "Coffee" },
  { emoji: "🚕", label: "Cab" },
  { emoji: "✈️", label: "Trip" },
  { emoji: "🎁", label: "Gift" },
  { emoji: "⚡", label: "Bills" },
  { emoji: "🎉", label: "Party" },
];

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

// keys must not steal focus from the note input, or the caret disappears
const keepFocus = (e: React.PointerEvent) => e.preventDefault();

const TONES = {
  letter: "bg-white text-foreground active:bg-accent",
  fn: "bg-[#dcd0e4] text-foreground active:bg-white",
  on: "bg-primary text-white",
  primary: "bg-gradient-to-r from-primary to-secondary font-semibold text-white",
};

function Key({
  children,
  onPress,
  tone = "letter",
  className = "",
}: {
  children: React.ReactNode;
  onPress: () => void;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <button
      type="button"
      onPointerDown={keepFocus}
      onClick={onPress}
      className={`flex h-[42px] items-center justify-center rounded-[9px] text-[17px] shadow-[0_1px_0_rgba(60,30,80,0.18)] transition-transform active:scale-90 ${TONES[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

export function FakeKeyboard({
  value,
  onChange,
  onDone,
  suggestions = NOTE_SUGGESTIONS,
  onSuggestion,
  maxLength = NOTE_MAX,
  doneLabel = "Done",
}: {
  value: string;
  onChange: (v: string) => void;
  onDone: () => void;
  suggestions?: Suggestion[];
  // replaces the default "swap the partial word for the suggestion" behaviour
  onSuggestion?: (s: Suggestion) => void;
  maxLength?: number;
  doneLabel?: string;
}) {
  const [shift, setShift] = useState(false);
  const caps = shift || value.length === 0;

  const partial = value.split(" ").pop()?.toLowerCase() ?? "";
  const matches = partial ? suggestions.filter((s) => s.label.toLowerCase().startsWith(partial)) : [];
  const shown = matches.length ? matches : suggestions;

  const type = (text: string) => {
    if (value.length + text.length > maxLength) return;
    onChange(value + text);
  };

  const pickSuggestion = (s: Suggestion) => {
    if (onSuggestion) return onSuggestion(s);
    const base = value.slice(0, value.length - partial.length);
    onChange((base + `${s.emoji} ${s.label} `).slice(0, maxLength));
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="bg-[#efe6f4] pb-6 pt-2"
    >
      {/* predictive suggestions */}
      <div
        className={`flex gap-2 overflow-x-auto px-3 pb-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          suggestions.length ? "" : "hidden"
        }`}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((s) => (
            <motion.button
              layout
              key={s.label}
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onPointerDown={keepFocus}
              onClick={() => pickSuggestion(s)}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-medium text-foreground shadow-sm active:scale-95"
            >
              <span>{s.emoji}</span>
              {s.label}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-[9px] px-[5px]">
        {ROWS.map((row, r) => (
          <div key={row} className="flex justify-center gap-[5px]">
            {r === 2 && (
              <Key onPress={() => setShift((s) => !s)} tone={shift ? "on" : "fn"} className="w-[42px]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4l8 8h-4.5v7h-7v-7H4l8-8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </Key>
            )}
            {row.split("").map((ch) => (
              <Key
                key={ch}
                onPress={() => {
                  type(caps ? ch.toUpperCase() : ch);
                  setShift(false);
                }}
                className="w-[34px]"
              >
                {caps ? ch.toUpperCase() : ch}
              </Key>
            ))}
            {r === 2 && (
              <Key onPress={() => onChange(value.slice(0, -1))} tone="fn" className="w-[42px]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 5h11v14H9l-6-7 6-7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <path d="M12.5 9.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </Key>
            )}
          </div>
        ))}
        <div className="flex gap-[5px] px-[1px]">
          <Key onPress={() => type(",")} tone="fn" className="w-[42px]">,</Key>
          <Key onPress={() => type(" ")} className="flex-1 text-[14px] text-muted-foreground">
            space
          </Key>
          <Key onPress={() => type(".")} tone="fn" className="w-[42px]">.</Key>
          <Key onPress={onDone} tone="primary" className="w-[84px] text-[15px]">
            {doneLabel}
          </Key>
        </div>
      </div>
    </motion.div>
  );
}
