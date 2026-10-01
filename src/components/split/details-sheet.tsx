"use client";

import { useState } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { Sheet } from "@/components/sheet";
import { Avatar } from "@/components/avatar";
import { CreatureHead, CreaturePaws } from "@/components/creature-head";
import { involvedIn, payerNames } from "@/components/split/split-card";
import { formatINR, noteLabel } from "@/lib/format";
import { netFor } from "@/lib/split-math";
import type { Group, Person, Split } from "@/lib/split-types";

const CONFETTI = ["#9333ea", "#ff5fa2", "#FFD966", "#4ade80", "#0ea5e9"];

function DetailsBody({
  split,
  group,
  onNudge,
  onCash,
  onSettleUp,
}: {
  split: Split;
  group: Group;
  onNudge: (p: Person) => void;
  onCash: (p: Person) => void;
  onSettleUp: () => void;
}) {
  const [nudged, setNudged] = useState<Record<string, number>>({});
  const lookX = useMotionValue(0);
  const lookY = useMotionValue(4);
  const people = involvedIn(split, group);
  const settledCount = people.filter((p) => split.settled[p.id]).length;
  const allSettled = settledCount === people.length;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* the creature peeks over the top of the sheet, and celebrates once everyone's square */}
      {/* window ends exactly at the sheet's top edge (the grabber row sits 16px above this body) */}
      <div className="pointer-events-none absolute -top-[78px] left-1/2 -ml-[48px] h-[62px] w-[96px] overflow-hidden">
        <motion.div
          key={allSettled ? "party" : "watch"}
          initial={allSettled ? { y: -10 } : { y: 60 }}
          animate={allSettled ? { y: [0, -8, 0] } : { y: 0 }}
          transition={allSettled ? { duration: 0.6, repeat: Infinity, repeatDelay: 0.4 } : { type: "spring", stiffness: 260, damping: 18, delay: 0.3 }}
        >
          <CreatureHead lookX={lookX} lookY={lookY} eyes={allSettled ? "happy" : "open"} />
        </motion.div>
      </div>
      <div className="pointer-events-none absolute -top-[23px] left-1/2 z-10 -ml-[24px]">
        <CreaturePaws />
      </div>

      <AnimatePresence>
        {allSettled &&
          Array.from({ length: 18 }).map((_, i) => {
            const a = (i / 18) * Math.PI * 2;
            return (
              <motion.span
                key={i}
                className="pointer-events-none absolute left-1/2 top-4 h-2 w-2 rounded-sm"
                style={{ background: CONFETTI[i % CONFETTI.length] }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                animate={{ x: Math.cos(a) * 140, y: Math.sin(a) * 90 + 60, opacity: 0, rotate: 200 }}
                transition={{ duration: 1.3, ease: "easeOut" }}
              />
            );
          })}
      </AnimatePresence>

      <div className="shrink-0 px-5 pt-4 text-center">
        <p className="text-[13px] font-medium text-muted-foreground">{split.note ? noteLabel(split.note) : "Expense"} · Today</p>
        <p className="mt-1 text-[34px] font-extrabold tabular-nums text-foreground">₹{formatINR(split.total)}</p>
        <p className="text-[12.5px] text-muted-foreground">
          Paid by <span className="font-semibold text-foreground">{payerNames(split, group)}</span>
        </p>

        {allSettled ? (
          <motion.p
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto mt-3 w-fit rounded-full bg-success/10 px-4 py-1.5 text-[13px] font-bold text-success"
          >
            All settled 🎉 Everyone&apos;s square
          </motion.p>
        ) : (
          <div className="mx-auto mt-3 max-w-[260px]">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                animate={{ width: `${(settledCount / people.length) * 100}%` }}
                transition={{ type: "spring", stiffness: 160, damping: 22 }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
              />
            </div>
            <p className="mt-1.5 text-[12px] font-medium text-muted-foreground">
              {settledCount} of {people.length} settled
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-5 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {people.map((p) => {
          const net = netFor(split, p.id);
          const owed = split.owed[p.id] ?? 0;
          const paidAmt = split.paid[p.id] ?? 0;
          const settled = split.settled[p.id];
          const isMe = p.id === "me";
          const name = isMe ? "You" : p.short;
          let line: string;
          if (paidAmt > 0) line = `Paid ₹${formatINR(paidAmt)} · share ₹${formatINR(owed)}`;
          else if (settled) line = `Paid their share of ₹${formatINR(owed)} ✓`;
          else line = `Owes ₹${formatINR(owed)}`;

          return (
            <div key={p.id} className="flex items-center gap-3 border-b border-border/60 py-3 last:border-0">
              <motion.span
                key={nudged[p.id] ?? 0}
                animate={nudged[p.id] ? { x: [0, -4, 4, -3, 3, 0] } : {}}
                transition={{ duration: 0.45 }}
                className="relative"
              >
                <Avatar person={p} size={40} status={settled ? "paid" : "pending"} />
                <AnimatePresence>
                  {nudged[p.id] && (
                    <motion.span
                      key={nudged[p.id]}
                      initial={{ opacity: 0, x: -30, y: 6, rotate: -20 }}
                      animate={{ opacity: [0, 1, 1, 0], x: [-30, -6, -6, -6], y: [6, 0, 0, -10], rotate: 0 }}
                      transition={{ duration: 1.2 }}
                      className="absolute -left-2 top-0 text-[18px]"
                    >
                      👉
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[14px] font-semibold text-foreground">{name}</p>
                <p className={`text-[11.5px] ${settled ? "text-muted-foreground" : "font-medium text-secondary"}`}>{line}</p>
                {net > 0 && <p className="text-[11px] font-semibold text-success">Gets back ₹{formatINR(net)}</p>}
              </div>

              {!settled && !isMe && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (nudged[p.id]) return;
                      setNudged((n) => ({ ...n, [p.id]: (n[p.id] ?? 0) + 1 }));
                      onNudge(p);
                    }}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition-transform active:scale-95 ${
                      nudged[p.id] ? "bg-muted text-muted-foreground" : "bg-accent text-primary"
                    }`}
                  >
                    {nudged[p.id] ? "Nudged ✓" : "👋 Nudge"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onCash(p)}
                    aria-label={`Mark ${p.short} as paid in cash`}
                    className="rounded-full bg-muted px-2.5 py-1.5 text-[12px] font-bold text-foreground transition-transform active:scale-95"
                  >
                    💵
                  </button>
                </div>
              )}
              {!settled && isMe && (
                <button
                  type="button"
                  onClick={onSettleUp}
                  className="rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-2 text-[12.5px] font-bold text-white shadow-md shadow-primary/25 active:scale-95"
                >
                  Settle up ₹{formatINR(-net)}
                </button>
              )}
            </div>
          );
        })}
        <p className="mt-3 text-center text-[11px] text-muted-foreground">💵 marks someone as paid in cash</p>
      </div>
    </div>
  );
}

export function DetailsSheet({
  split,
  group,
  onClose,
  onNudge,
  onCash,
  onSettleUp,
}: {
  split: Split | null;
  group: Group;
  onClose: () => void;
  onNudge: (p: Person) => void;
  onCash: (p: Person) => void;
  onSettleUp: () => void;
}) {
  return (
    <Sheet open={!!split} onClose={onClose}>
      {split && <DetailsBody split={split} group={group} onNudge={onNudge} onCash={onCash} onSettleUp={onSettleUp} />}
    </Sheet>
  );
}
