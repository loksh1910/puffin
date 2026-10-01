"use client";

import { motion, MotionValue } from "framer-motion";
import { CreatureHead } from "@/components/creature-head";
import { CREATURE } from "@/components/creature-ball";

// Sits at the top of the account-switching sheet with its arms hanging down, reaching
// further as a card gets dragged toward it.
export function ReachingCreature({
  lookX,
  lookY,
  reaching,
}: {
  lookX: MotionValue<number>;
  lookY: MotionValue<number>;
  reaching: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        animate={reaching ? { y: 2, rotate: 0 } : { y: [0, -3, 0], rotate: [-2, 2, -2] }}
        transition={reaching ? { duration: 0.3 } : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <CreatureHead lookX={lookX} lookY={lookY} eyes="open" mouth={reaching ? "ooh" : "smile"} />
      </motion.div>

      <div className="-mt-1 flex gap-9">
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <motion.div
              animate={{ height: reaching ? 28 : 8 }}
              transition={{ type: "spring", stiffness: 230, damping: 15 }}
              className="w-[8px] rounded-full"
              style={{ background: CREATURE.body }}
            />
            <motion.svg
              width="20"
              height="16"
              viewBox="0 0 20 16"
              animate={{ scale: reaching ? 1.15 : 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
            >
              <ellipse cx="10" cy="8" rx="9.5" ry="7.5" fill={CREATURE.body} stroke={CREATURE.bodyDark} strokeWidth="1.2" />
              <path d="M5 5v4M10 4v5M15 5v4" stroke={CREATURE.bodyDark} strokeWidth="1.1" strokeLinecap="round" />
            </motion.svg>
          </div>
        ))}
      </div>

      <motion.p
        key={reaching ? "reaching" : "idle"}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-1 rounded-2xl bg-accent px-2.5 py-1 text-[11px] font-semibold text-primary"
      >
        {reaching ? "Almost there… 👀" : "Give me the card! 🙌"}
      </motion.p>
    </div>
  );
}
