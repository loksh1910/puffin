"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  AnimatePresence,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  useVelocity,
} from "framer-motion";
import { CreatureBall, Mood } from "@/components/creature-ball";
import { useElementSize } from "@/lib/use-element-size";
import { formatINR } from "@/lib/format";

const THUMB = 56;
const PAD = 4;
const COMPLETE_AT = 0.82;

export type SwipeStatus = "locked" | "arriving" | "ready";

export function SwipeToPay({
  amount,
  status,
  hint,
  onSwiped,
}: {
  amount: number;
  status: SwipeStatus;
  // bump to make the creature wiggle and ask to be swiped (e.g. someone pressed the machine's ✓)
  hint: number;
  onSwiped: () => void;
}) {
  const [trackRef, { width }] = useElementSize<HTMLDivElement>();
  const maxX = Math.max(0, width - THUMB - PAD * 2);
  const ready = status === "ready";

  const x = useMotionValue(0);
  const maxMV = useMotionValue(0);
  const [dragging, setDragging] = useState(false);
  const [armed, setArmed] = useState(false);
  const [done, setDone] = useState(false);
  const [taps, setTaps] = useState(0);
  // a press that turned into a drag shouldn't also count as a tap
  const movedRef = useRef(false);

  useEffect(() => {
    maxMV.set(maxX);
  }, [maxX, maxMV]);

  // if the creature is called back to the machine (PIN edited), it starts from the left again
  useEffect(() => {
    if (!ready) x.set(0);
  }, [ready, x]);

  useMotionValueEvent(x, "change", (v) => setArmed(maxMV.get() > 0 && v >= maxMV.get() * COMPLETE_AT));

  const lean = useTransform(useVelocity(x), [-900, 0, 900], [-16, 0, 16]);
  const fillWidth = useTransform(x, (v) => v + THUMB + PAD * 2);
  const labelOpacity = useTransform([x, maxMV], ([v, m]: number[]) => (m ? 1 - Math.min(1, v / (m * 0.5)) : 1));

  const complete = () => {
    if (done || !ready) return;
    setDone(true);
    animate(x, maxX, { type: "spring", stiffness: 320, damping: 28 });
    onSwiped();
  };

  const mood: Mood = done ? "happy" : armed ? "armed" : dragging ? "dragging" : "idle";
  const hintKey = hint + taps;

  return (
    <div
      ref={trackRef}
      className={`relative h-16 w-full rounded-full transition-colors duration-300 ${ready ? "bg-accent" : "bg-muted"}`}
    >
      {ready && (
        <>
          <motion.div
            style={{ width: fillWidth }}
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#e7d2ff] to-[#ffc9e4]"
          />
          {/* "let go now" — trail turns full brand gradient once it's far enough */}
          <motion.div
            style={{ width: fillWidth }}
            animate={{ opacity: armed || done ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-secondary"
          />
        </>
      )}

      {/* label */}
      <div className="pointer-events-none absolute inset-y-0 left-16 right-4 flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {ready && !done ? (
            <motion.div
              key="swipe"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
            <motion.div style={{ opacity: labelOpacity }} className="flex items-center gap-1.5">
              <motion.span
                animate={{ backgroundPosition: ["100% 0%", "-100% 0%"] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                className="bg-[linear-gradient(90deg,#9333ea_0%,#9333ea_38%,#ff8fc8_50%,#9333ea_62%,#9333ea_100%)] bg-[length:200%_100%] bg-clip-text text-[15px] font-bold text-transparent"
              >
                Swipe to pay ₹{formatINR(amount)}
              </motion.span>
              <span className="flex text-[17px] font-bold text-primary">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
                  >
                    ›
                  </motion.span>
                ))}
              </span>
            </motion.div>
            </motion.div>
          ) : !ready ? (
            <motion.p
              key={status}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-[13.5px] font-semibold text-muted-foreground"
            >
              {status === "locked" ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="11" width="14" height="9" rx="2.5" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 11V8a4 4 0 118 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Enter your PIN to unlock
                </>
              ) : (
                "Here comes your buddy…"
              )}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {done && (
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="pointer-events-none absolute inset-y-0 left-6 flex items-center text-[15px] font-bold text-white"
          >
            Sending ₹{formatINR(amount)}…
          </motion.p>
        )}
      </AnimatePresence>

      {/* the creature's empty seat, waiting for it to jump down */}
      {!ready && (
        <div className="absolute left-1 top-1 h-14 w-14 rounded-full border-2 border-dashed border-muted-foreground/30" />
      )}

      <AnimatePresence>
        {ready && (
          <motion.button
            key="thumb"
            type="button"
            aria-label={`Swipe to pay ₹${formatINR(amount)}`}
            style={{ x }}
            drag={done ? false : "x"}
            dragConstraints={{ left: 0, right: maxX }}
            dragElastic={0}
            dragMomentum={false}
            whileDrag={{ scale: 1.12 }}
            onTapStart={() => {
              movedRef.current = false;
            }}
            onDragStart={() => {
              movedRef.current = true;
              setDragging(true);
            }}
            onDragEnd={() => {
              setDragging(false);
              if (x.get() >= maxX * COMPLETE_AT) complete();
              else animate(x, 0, { type: "spring", stiffness: 420, damping: 22 });
            }}
            onTap={() => {
              if (!movedRef.current && !done) setTaps((t) => t + 1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                complete();
              }
            }}
            exit={{ opacity: 0, y: -50, scale: 0.4, transition: { duration: 0.25 } }}
            className="absolute left-1 top-1 z-10 h-14 w-14 cursor-grab touch-none rounded-full active:cursor-grabbing"
          >
            {/* hop down from the machine: arcs in from above-centre and squashes on landing */}
            <motion.div
              initial={{ x: 120, y: -150, scale: 0.5, rotate: -30 }}
              animate={{ x: 0, y: 0, scale: 1, rotate: 0 }}
              transition={{
                x: { type: "spring", stiffness: 110, damping: 17 },
                y: { type: "spring", stiffness: 240, damping: 13 },
                scale: { duration: 0.35 },
                rotate: { type: "spring", stiffness: 160, damping: 12 },
              }}
            >
              <motion.div
                key={hintKey}
                animate={
                  hintKey > 0 && !done
                    ? { x: [0, 20, 0, 12, 0], rotate: [0, 12, 0, 8, 0] }
                    : done
                      ? { y: [0, -16, 0, -9, 0], scaleY: [1, 1.1, 0.88, 1.05, 1] }
                      : {}
                }
                transition={{ duration: 0.8, ease: "easeInOut" }}
              >
                {/* idle nudge teaches the gesture */}
                <motion.div
                  animate={!dragging && !done ? { x: [0, 9, 0] } : { x: 0 }}
                  transition={!dragging && !done ? { duration: 0.7, repeat: Infinity, repeatDelay: 1.8, ease: "easeInOut" } : { duration: 0.15 }}
                >
                  <motion.div style={{ rotate: lean }}>
                    <CreatureBall mood={mood} />
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>

            <AnimatePresence>
              {hintKey > 0 && !done && (
                <motion.span
                  key={hintKey}
                  initial={{ opacity: 0, y: 6, scale: 0.8 }}
                  animate={{ opacity: [0, 1, 1, 0], y: [6, 0, 0, -4], scale: [0.8, 1, 1, 1] }}
                  transition={{ duration: 2.2, times: [0, 0.1, 0.8, 1] }}
                  className="pointer-events-none absolute -top-10 left-0 whitespace-nowrap rounded-2xl rounded-bl-sm bg-foreground px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg"
                >
                  Hold me &amp; swipe →
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
