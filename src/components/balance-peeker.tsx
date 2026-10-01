"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { CreatureHead, CreaturePaws } from "@/components/creature-head";

type Phase = "open" | "covering";

// Peeks over the top of the balance card, curious about the number — then catches itself
// and covers its eyes, because your balance is none of its business. Loops forever.
export function BalancePeeker() {
  const [phase, setPhase] = useState<Phase>("open");
  const lookX = useMotionValue(0);
  const lookY = useMotionValue(6);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const cycle = (openMs: number) => {
      setPhase("open");
      timer = setTimeout(() => {
        if (cancelled) return;
        setPhase("covering");
        timer = setTimeout(() => !cancelled && cycle(2600), 1300);
      }, openMs);
    };
    cycle(2000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const covering = phase === "covering";

  return (
    <>
      {/* only the head is clipped, so it reads as peeking "over the wall" */}
      <div className="pointer-events-none absolute inset-x-0 -top-[100px] z-0 h-[104px] overflow-hidden">
        <motion.div
          animate={{ rotate: covering ? -6 : 0, y: covering ? -2 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          className="absolute -bottom-[14px] left-1/2 -ml-[48px] h-[78px] w-[96px]"
        >
          <CreatureHead lookX={lookX} lookY={lookY} eyes={covering ? "covering" : "open"} mouth={covering ? "ooh" : "smile"} />
        </motion.div>
      </div>

      {/* paws and speech bubble live outside that clipping box, or they'd get a hard-cut edge */}
      <div className="pointer-events-none absolute -top-[7px] left-1/2 z-20 -ml-[24px]">
        <CreaturePaws />
      </div>

      <AnimatePresence>
        {covering && (
          <motion.span
            initial={{ opacity: 0, scale: 0.7, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 380, damping: 18 }}
            className="pointer-events-none absolute -top-[64px] right-1 z-30 whitespace-nowrap rounded-2xl rounded-br-sm bg-white px-2.5 py-1.5 text-[10px] font-semibold text-foreground shadow-md"
          >
            Not peeking, promise 🙈
          </motion.span>
        )}
      </AnimatePresence>
    </>
  );
}
