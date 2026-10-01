"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { CreatureHead, CreaturePaws, HEAD_WIDTH } from "@/components/creature-head";

export type QuickAction = "split" | "scan" | "pay";

// body below the face that shows as it wakes and sits up
const BODY_EXTRA = 40;
const SHOW_ASLEEP = 50; // ears and closed eyes, slumped on the ledge
const SHOW_AWAKE = 82;
// the actions fan out on an arc centred this far above the bottom edge
const PIVOT = 70;
const RADIUS = 116;

const ICON_PROPS = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ACTIONS: { id: QuickAction; label: string; angle: number; primary?: boolean; icon: React.ReactNode }[] = [
  {
    id: "split",
    label: "Split with friends",
    angle: 158,
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="10" r="2.4" />
        <path d="M3.5 19c.5-3.2 2.8-5 5.5-5s5 1.8 5.5 5M15 15c2 0 4 1.2 4.5 4" />
      </svg>
    ),
  },
  {
    id: "scan",
    label: "Scan QR",
    angle: 90,
    primary: true,
    icon: (
      <svg {...ICON_PROPS} width={28} height={28}>
        <path d="M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6z" />
        <path d="M14 14h2.5M14 18h2.5M18.5 14v2.5M18.5 18.5H20" />
      </svg>
    ),
  },
  {
    id: "pay",
    label: "Pay anyone",
    angle: 22,
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5 20c.6-4 3.3-6.2 7-6.2S18.4 16 19 20M16.5 6.5l2 2 3.5-3.5" />
      </svg>
    ),
  },
];

// the "tap me" nudge shows once per page load, not every time Home remounts
let hintShown = false;

// Sleeping mascot at the bottom of Home. Tap it and it wakes up with quick actions fanned above it.
export function QuickActionsDock({ onAction }: { onAction: (action: QuickAction) => void }) {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(false);
  const lookX = useMotionValue(0);
  const lookUp = useMotionValue(-5);

  useEffect(() => {
    if (hintShown) return;
    const t = setTimeout(() => {
      hintShown = true;
      setHint(true);
    }, 1400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(false), 3800);
    return () => clearTimeout(t);
  }, [hint]);

  const toggle = () => {
    setHint(false);
    setOpen((o) => !o);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 z-30 bg-[#201432]/30 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      {/* content scrolls away softly behind the creature */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 bg-gradient-to-t from-background via-background/85 to-transparent" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
        <div className="absolute left-1/2" style={{ bottom: PIVOT }}>
          <AnimatePresence>
            {open &&
              ACTIONS.map((a, i) => {
                const rad = (a.angle * Math.PI) / 180;
                return (
                  <motion.button
                    key={a.id}
                    type="button"
                    initial={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
                    animate={{ x: Math.cos(rad) * RADIUS, y: -Math.sin(rad) * RADIUS, scale: 1, opacity: 1 }}
                    exit={{ x: 0, y: 0, scale: 0.2, opacity: 0, transition: { duration: 0.2, delay: (ACTIONS.length - 1 - i) * 0.03 } }}
                    transition={{ type: "spring", stiffness: 360, damping: 21, delay: 0.1 + i * 0.06 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setOpen(false);
                      onAction(a.id);
                    }}
                    className="pointer-events-auto absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"
                  >
                    <span
                      className={`flex items-center justify-center rounded-full shadow-lg ${
                        a.primary
                          ? "h-[68px] w-[68px] bg-gradient-to-br from-primary to-secondary text-white shadow-primary/40"
                          : "h-14 w-14 bg-card text-primary shadow-black/15"
                      }`}
                    >
                      {a.icon}
                    </span>
                    <span className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-card px-2.5 py-0.5 text-[11px] font-semibold text-foreground shadow-sm">
                      {a.label}
                    </span>
                  </motion.button>
                );
              })}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {hint && !open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 380, damping: 20 }}
              className="absolute bottom-[58px] left-1/2 -ml-[150px] origin-bottom-right whitespace-nowrap rounded-2xl rounded-br-sm bg-foreground px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg"
            >
              Psst… tap me for quick pay
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={toggle}
          aria-label={open ? "Close quick actions" : "Open quick actions"}
          aria-expanded={open}
          animate={{ height: open ? SHOW_AWAKE : SHOW_ASLEEP }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="pointer-events-auto absolute bottom-0 left-1/2 -ml-[48px]"
          style={{ width: HEAD_WIDTH }}
        >
          <motion.div
            key={open ? "awake" : "asleep"}
            className="absolute inset-x-0 top-0"
            initial={open ? { y: -14, rotate: -6 } : { y: 0 }}
            animate={open ? { y: 0, rotate: 0 } : { y: [0, 3, 0] }}
            transition={
              open
                ? { type: "spring", stiffness: 420, damping: 12 }
                : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <CreatureHead
              lookX={lookX}
              lookY={lookUp}
              eyes={open ? "open" : "sleepy"}
              mouth={open ? "smile" : "snore"}
              bodyExtra={BODY_EXTRA}
            />
          </motion.div>

          {/* z z z */}
          {!open &&
            [0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute left-[74px] top-0 font-extrabold text-primary"
                style={{ fontSize: 10 + i * 3 }}
                initial={{ opacity: 0, x: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], x: [0, 8 + i * 4, 14 + i * 6], y: [0, -16, -34] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
              >
                z
              </motion.span>
            ))}

          {/* startled "!" as it wakes */}
          <AnimatePresence>
            {open && (
              <motion.span
                key="wake"
                className="absolute -top-6 left-[76px] text-[20px] font-black text-secondary"
                initial={{ opacity: 0, scale: 0.4, y: 6 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.2, 1, 1], y: 0 }}
                transition={{ duration: 0.9, times: [0, 0.2, 0.7, 1] }}
              >
                !
              </motion.span>
            )}
          </AnimatePresence>

          <span className="absolute -bottom-[3px] left-1/2 z-10 -ml-[24px]">
            <CreaturePaws />
          </span>
        </motion.button>
      </div>
    </>
  );
}
