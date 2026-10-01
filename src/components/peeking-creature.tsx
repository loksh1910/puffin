"use client";

import { useEffect } from "react";
import { animate, motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { CreatureHead, CreaturePaws } from "@/components/creature-head";

const RANGE = 44; // how far it shimmies either side of centre, keeping the head within the machine's width
const REST_X = 42; // where it settles to duck, leaving room for the speech bubble on its left

// Head is clipped just below the machine's top edge so it only ever shows "over the wall";
// paws render in front of the machine body so it reads as gripping the edge.
export function PeekingCreature({
  pinLength,
  done,
  gone,
}: {
  pinLength: number;
  done: boolean;
  // it has hopped down into the swipe-to-pay slider
  gone: boolean;
}) {
  const x = useMotionValue(0);
  // pupils stay locked on the machine screen: when it's off to the left it looks right, and vice versa
  const lookX = useTransform(x, [-RANGE, RANGE], [4.5, -4.5]);
  const lookDown = useMotionValue(5);

  useEffect(() => {
    if (done) {
      const settle = animate(x, REST_X, { type: "spring", stiffness: 140, damping: 18 });
      return () => settle.stop();
    }
    let cancelled = false;
    let current = animate(x, RANGE, {
      duration: 0.3 + (Math.abs(RANGE - x.get()) / RANGE) * 1.4,
      ease: "easeInOut",
    });
    current.then(() => {
      if (cancelled) return;
      current = animate(x, [RANGE, -RANGE], {
        duration: 3.4,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "mirror",
      });
    });
    return () => {
      cancelled = true;
      current.stop();
    };
  }, [done, x]);

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 -top-[100px] z-0 h-[104px] overflow-hidden">
        <motion.div style={{ x }} className="absolute -bottom-[14px] left-1/2 -ml-[48px] h-[78px] w-[96px]">
          <motion.div
            initial={{ y: 90 }}
            animate={{ y: gone ? 110 : done ? 12 : 0 }}
            transition={
              gone
                ? { duration: 0.22, ease: "easeIn" }
                : { type: "spring", stiffness: 240, damping: 16, delay: done ? 0 : 0.25 }
            }
          >
            {/* waddle: tilt side to side with a little hop on each step */}
            <motion.div
              className="origin-bottom"
              animate={done ? { rotate: 0, y: 0 } : { rotate: [-7, 7, -7], y: [0, -5, 0, -5, 0] }}
              transition={done ? { duration: 0.3 } : { duration: 0.85, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                key={pinLength}
                initial={{ y: -6 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 12 }}
              >
                <CreatureHead lookX={lookX} lookY={lookDown} eyes={done ? "happy" : "open"} />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {done && !gone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.3 }}
            className="pointer-events-none absolute -top-[50px] right-[90px] z-30 origin-bottom-right whitespace-nowrap rounded-2xl rounded-br-sm bg-white px-2.5 py-1.5 text-[10px] font-semibold leading-tight text-foreground shadow-md"
          >
            I saw nothing,
            <br />
            promise 🙈
          </motion.div>
        )}
      </AnimatePresence>

      {/* paws shimmy hand-over-hand along the edge */}
      <motion.div style={{ x }} className="pointer-events-none absolute -top-[7px] left-1/2 z-20 -ml-[24px]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: done ? 0 : 1, y: done ? 10 : 0 }}
          transition={{ delay: done ? 0 : 0.45 }}
        >
          <CreaturePaws action={done ? "still" : "shimmy"} />
        </motion.div>
      </motion.div>
    </>
  );
}
