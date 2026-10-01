"use client";

import { useEffect, useState } from "react";
import { animate, motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { StatusBar } from "@/components/status-bar";
import { CreatureBall } from "@/components/creature-ball";
import { Avatar } from "@/components/avatar";
import { formatINR } from "@/lib/format";
import type { Person } from "@/lib/split-types";

const MESSAGES = ["Sending your money…", "Breathe in… breathe out…", "Almost there, promise"];

// the creature's route: an arc from your avatar to the recipient's
const P0 = { x: 44, y: 150 };
const P1 = { x: 170, y: 22 };
const P2 = { x: 296, y: 150 };
const PATH = `M${P0.x} ${P0.y} Q${P1.x} ${P1.y} ${P2.x} ${P2.y}`;
// start/stop short of the avatars so it doesn't stand on them
const T_START = 0.14;
const T_END = 0.86;
const CREATURE_SIZE = 60;

function pointAt(t: number) {
  const u = 1 - t;
  return {
    x: u * u * P0.x + 2 * u * t * P1.x + t * t * P2.x,
    y: u * u * P0.y + 2 * u * t * P1.y + t * t * P2.y,
  };
}

function slopeDeg(t: number) {
  const dx = 2 * (1 - t) * (P1.x - P0.x) + 2 * t * (P2.x - P1.x);
  const dy = 2 * (1 - t) * (P1.y - P0.y) + 2 * t * (P2.y - P1.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

export function ProcessingScreen({
  amount,
  recipient,
  onDone,
}: {
  amount: number;
  recipient: Person;
  onDone: () => void;
}) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [arrived, setArrived] = useState(false);

  const progress = useMotionValue(0);
  const t = useTransform(progress, (p) => T_START + (T_END - T_START) * p);
  const x = useTransform(t, (v) => pointAt(v).x - CREATURE_SIZE / 2);
  const y = useTransform(t, (v) => pointAt(v).y - CREATURE_SIZE + 2);
  // lean into the climb and the descent, but only a little — it's a calm walk
  const lean = useTransform(t, (v) => slopeDeg(v) * 0.3);

  useEffect(() => {
    let cancelled = false;
    const travel = animate(progress, 1, { duration: 2.6, delay: 0.3, ease: [0.45, 0, 0.4, 1] });
    travel.then(() => !cancelled && setArrived(true));
    const cycle = setInterval(() => setMsgIndex((i) => Math.min(i + 1, MESSAGES.length - 1)), 1100);
    const done = setTimeout(onDone, 3800);
    return () => {
      cancelled = true;
      travel.stop();
      clearInterval(cycle);
      clearTimeout(done);
    };
  }, [onDone, progress]);

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#fbf3ff] to-[#ffeaf4]">
      <StatusBar />
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="relative h-[206px] w-[340px]">
          <svg width="340" height="206" viewBox="0 0 340 206" className="absolute inset-0 overflow-visible">
            <defs>
              <linearGradient id="trail" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#9333ea" />
                <stop offset="100%" stopColor="#ff5fa2" />
              </linearGradient>
            </defs>
            <motion.path
              d={PATH}
              fill="none"
              stroke="#d9c2ea"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="1 10"
              animate={{ strokeDashoffset: [0, -22] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            {/* progress trail behind the creature */}
            <motion.path d={PATH} fill="none" stroke="url(#trail)" strokeWidth="4" strokeLinecap="round" style={{ pathLength: t }} />
          </svg>

          {/* you */}
          <div className="absolute flex flex-col items-center" style={{ left: P0.x - 28, top: P0.y - 28 }}>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#2e1a47] to-[#6a3de8] text-white shadow-md">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="currentColor" />
                <path d="M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="mt-1.5 text-[11.5px] font-medium text-muted-foreground">You</p>
          </div>

          {/* aditi, gently "breathing" while she waits */}
          <div className="absolute flex flex-col items-center" style={{ left: P2.x - 28, top: P2.y - 28 }}>
            {[0, 1].map((i) => (
              <motion.span
                key={i}
                className="absolute h-14 w-14 rounded-full border-2 border-secondary/40"
                animate={{ scale: [1, 1.7], opacity: [0.7, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: i * 1.1, ease: "easeOut" }}
              />
            ))}
            <motion.div
              animate={arrived ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.45 }}
              className="relative"
            >
              <Avatar person={recipient} size={56} className="shadow-md" />
            </motion.div>
            <p className="mt-1.5 text-[11.5px] font-medium text-muted-foreground">{recipient.short}</p>
            <AnimatePresence>
              {arrived && (
                <motion.span
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: [0, 1, 1, 0], y: -44 }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                  className="absolute -top-2 whitespace-nowrap text-[14px] font-extrabold text-primary"
                >
                  +₹{formatINR(amount)}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* the courier: walks the arc with a ₹ coin balanced on its head */}
          <motion.div className="absolute left-0 top-0" style={{ x, y, rotate: lean }}>
            <motion.div
              animate={arrived ? { y: [0, -12, 0] } : { y: [0, -4, 0] }}
              transition={arrived ? { duration: 0.45 } : { duration: 0.55, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <AnimatePresence>
                {!arrived && (
                  <motion.div
                    exit={{ x: 44, y: 40, scale: 0.3, opacity: 0, transition: { duration: 0.35, ease: "easeIn" } }}
                    className="absolute -top-[13px] left-1/2 z-10 -ml-[12px]"
                  >
                    <motion.div
                      animate={{ rotate: [-12, 12, -12] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                      className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#e6a800] bg-[#FFD966] text-[12px] font-extrabold text-[#8a5a00] shadow-md"
                    >
                      ₹
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              <CreatureBall mood={arrived ? "happy" : "idle"} size={CREATURE_SIZE} />
            </motion.div>
          </motion.div>
        </div>

        <div className="mt-8 h-7">
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="text-center text-[17px] font-semibold text-foreground"
            >
              {MESSAGES[msgIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
        <p className="mt-2 text-center text-[12.5px] text-muted-foreground">
          ₹{formatINR(amount)} to {recipient.name} · please don&apos;t close the app
        </p>
      </div>
    </div>
  );
}
