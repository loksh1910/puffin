"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PeekingCreature } from "@/components/peeking-creature";
import { useElementSize } from "@/lib/use-element-size";
import { formatINR } from "@/lib/format";

export type MachinePhase = "select" | "inserting" | "swiping" | "zoom-pin";
export type KeyPress = { key: string; n: number } | null;
// a digit, "⌫", "cancel" or "confirm"
export type MachineKey = string;

const MAX_ZOOM = 1.3;
const MIN_ZOOM = 0.8;
const DIGIT_BASE = "rgba(255,255,255,0.14)";

const KEYS: { id: string; label: string; action: MachineKey | null; base: string; text: string }[] = [
  ..."123456789".split("").map((d) => ({ id: d, label: d, action: d, base: DIGIT_BASE, text: "text-white/90" })),
  { id: "*", label: "*", action: null, base: DIGIT_BASE, text: "text-white/90" },
  { id: "0", label: "0", action: "0", base: DIGIT_BASE, text: "text-white/90" },
  { id: "#", label: "#", action: null, base: DIGIT_BASE, text: "text-white/90" },
  { id: "✕", label: "✕", action: "cancel", base: "#ff5d6c", text: "text-white" },
  { id: "⌫", label: "‹", action: "⌫", base: "#ffd24d", text: "text-[#6b4a00]" },
  { id: "✓", label: "✓", action: "confirm", base: "#34d399", text: "text-white" },
];

export function PosMachine({
  phase,
  amount,
  pinLength,
  pressed,
  maxHeight,
  creatureGone,
  onKey,
}: {
  phase: MachinePhase;
  amount: number;
  pinLength: number;
  pressed: KeyPress;
  maxHeight: number;
  creatureGone: boolean;
  onKey: (key: MachineKey) => void;
}) {
  const [ref, { height }] = useElementSize<HTMLDivElement>();
  const zoomed = phase === "zoom-pin";
  const pinDone = pinLength >= 4;

  // grow as big as the space between header and PIN sheet allows, centred in it
  const zoom = height && maxHeight ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, maxHeight / height)) : MAX_ZOOM;
  const scale = zoomed ? zoom : 1;
  const y = zoomed && height && maxHeight ? Math.max(0, (maxHeight - height * zoom) / 2) : 0;

  return (
    <motion.div
      ref={ref}
      animate={{ scale, y }}
      transition={{ type: "spring", stiffness: 200, damping: 24 }}
      className="relative mx-auto mt-10 w-[184px] origin-top"
    >
      {/* printer hump at the back */}
      <div className="absolute -top-[22px] left-1/2 z-0 h-[44px] w-[128px] -translate-x-1/2 rounded-t-[20px] bg-gradient-to-b from-secondary to-[#e64a8f]">
        <div className="mx-auto mt-[7px] h-[5px] w-[88px] rounded-full bg-[#b8306d]" />
      </div>

      {zoomed && <PeekingCreature pinLength={pinLength} done={pinDone} gone={creatureGone} />}

      <div className="relative z-10 rounded-[28px] bg-gradient-to-b from-[#7c3aed] to-[#5b21b6] p-3 pt-3.5 shadow-2xl shadow-purple-900/35">
        {/* card slot */}
        <div className="relative mx-auto mb-2.5 h-[9px] w-[104px] rounded-full bg-[#3a1766] shadow-[inset_0_2px_3px_rgba(0,0,0,0.4)]">
          <AnimatePresence>
            {phase === "swiping" && (
              <motion.div
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: [-40, 118], opacity: [0, 1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeInOut" }}
                className="absolute -top-[26px] h-[30px] w-[26px] rounded-t-[5px] bg-gradient-to-b from-secondary to-primary shadow-md"
              />
            )}
          </AnimatePresence>
        </div>

        {/* screen */}
        <div className="relative flex h-[78px] flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#f4fbe9] shadow-[inset_0_2px_6px_rgba(40,60,20,0.15)]">
          <AnimatePresence mode="wait">
            {zoomed ? (
              <motion.div
                key="pin"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <span className="text-[17px] font-bold tabular-nums text-foreground">₹{formatINR(amount)}</span>
                <span className="mt-0.5 text-[8.5px] font-semibold tracking-[0.12em] text-muted-foreground">
                  {pinDone ? "SWIPE BELOW TO PAY" : "ENTER UPI PIN"}
                </span>
                <div className="mt-1.5 flex gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <motion.span
                      key={i}
                      animate={{
                        scale: i < pinLength ? [1, 1.35, 1] : 1,
                        backgroundColor: i < pinLength ? "#9333ea" : "#d9cce3",
                      }}
                      transition={{ duration: 0.25 }}
                      className="h-2.5 w-2.5 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="wave"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-1"
              >
                <motion.svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                >
                  <path
                    d="M8 9a5.5 5.5 0 018 0M5.5 6.2a9 9 0 0113 0M10.6 12a2 2 0 013 0"
                    stroke="#9333ea"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </motion.svg>
                <span className="text-[9.5px] font-semibold text-foreground/70">
                  {phase === "select" ? "Insert card" : "Reading card…"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* keypad — tappable while entering the PIN, and lights up in sync with the on-screen pad */}
        <div className={`mt-2.5 grid grid-cols-3 gap-1.5 ${zoomed ? "" : "pointer-events-none"}`}>
          {KEYS.map((k, i) => {
            const hit = pressed?.key === k.id;
            return (
              <motion.button
                key={hit ? `${k.id}-${pressed?.n}` : k.id}
                type="button"
                disabled={!k.action || (k.action === "confirm" && !pinDone)}
                onClick={() => k.action && onKey(k.action)}
                initial={hit ? { backgroundColor: "#ffffff", scale: 0.85 } : false}
                animate={{ backgroundColor: k.base, scale: 1 }}
                transition={{ duration: 0.35 }}
                className={`flex h-[17px] items-center justify-center rounded-md text-[9px] font-bold ${k.text} ${
                  i >= 12 ? "mt-0.5" : ""
                }`}
              >
                {k.label}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
