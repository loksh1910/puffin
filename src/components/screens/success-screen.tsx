"use client";

import { motion } from "framer-motion";
import { StatusBar } from "@/components/status-bar";
import { CreatureBall } from "@/components/creature-ball";
import { formatINR, noteLabel } from "@/lib/format";
import type { Person } from "@/lib/split-types";

const CONFETTI_COLORS = ["#9333ea", "#ff5fa2", "#FFD966", "#c9a2ff", "#4ade80"];
const PIECES = Array.from({ length: 22 }).map((_, i) => {
  const angle = (i / 22) * Math.PI * 2;
  const distance = 110 + (i % 4) * 22;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    rotate: (i * 47) % 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    round: i % 3 === 0,
  };
});

export function SuccessScreen({
  amount,
  note,
  recipient,
  onDone,
}: {
  amount: number;
  note: string;
  recipient: Person;
  onDone: () => void;
}) {
  const txnId = "FIN" + String((Math.round(amount * 100) * 7919) % 1e8).padStart(8, "0");

  return (
    <div className="flex h-full flex-col bg-background">
      <StatusBar />
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="relative flex h-40 w-40 items-center justify-center">
          {PIECES.map((p, i) => (
            <motion.span
              key={i}
              className={`absolute h-2.5 ${p.round ? "w-2.5 rounded-full" : "w-1.5 rounded-sm"}`}
              style={{ backgroundColor: p.color }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
              animate={{ x: p.x, y: p.y, opacity: 0, scale: 1, rotate: p.rotate }}
              transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
            />
          ))}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 14 }}
            className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary shadow-xl shadow-primary/30"
          >
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
              <motion.path
                d="M5 13l4 4L19 7"
                stroke="white"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.45, delay: 0.3 }}
              />
            </svg>
          </motion.div>

          {/* the courier pops up beside the tick to celebrate the delivery */}
          <motion.div
            initial={{ y: 60, scale: 0.4, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 13, delay: 0.55 }}
            className="absolute -bottom-3 -right-10 z-10"
          >
            <motion.div
              animate={{ y: [0, -12, 0], scaleY: [1, 1.06, 0.92, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.5, delay: 1.1, ease: "easeOut" }}
              className="origin-bottom"
            >
              <CreatureBall mood="happy" size={66} cheer />
            </motion.div>
            <motion.span
              initial={{ opacity: 0, scale: 0.6, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 18, delay: 1 }}
              className="absolute -top-7 left-11 origin-bottom-left whitespace-nowrap rounded-2xl rounded-bl-sm bg-white px-2.5 py-1 text-[11px] font-bold text-foreground shadow-md"
            >
              Delivered! 💜
            </motion.span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-8 text-center"
        >
          <p className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-[22px] font-extrabold text-transparent">
            Paid! 🎉
          </p>
          <p className="mt-1 text-[40px] font-bold tabular-nums text-foreground">₹{formatINR(amount)}</p>
          <p className="mt-1 text-[14px] text-foreground">
            to <span className="font-semibold">{recipient.name}</span>
          </p>
          {note && (
            <p className="mx-auto mt-3 w-fit max-w-[260px] truncate rounded-full bg-accent px-3.5 py-1.5 text-[12.5px] font-medium text-accent-foreground">
              {noteLabel(note)}
            </p>
          )}
          <p className="mt-4 text-[11.5px] text-muted-foreground">UPI Ref · {txnId}</p>
        </motion.div>
      </div>

      <div className="px-6 pb-8">
        <motion.button
          type="button"
          onClick={onDone}
          whileTap={{ scale: 0.97 }}
          className="w-full rounded-full bg-gradient-to-r from-primary to-secondary py-4 text-[15px] font-semibold text-white shadow-lg shadow-primary/25"
        >
          Done
        </motion.button>
      </div>
    </div>
  );
}
