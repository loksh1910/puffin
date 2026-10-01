"use client";

import { motion, useTransform, MotionValue } from "framer-motion";
import { CreatureHead, CreaturePaws, HEAD_HEIGHT, HEAD_WIDTH } from "@/components/creature-head";
import { useElementSize } from "@/lib/use-element-size";

// body below the face, revealed as it rises on tiptoes
const BODY_EXTRA = 60;
const TOTAL = HEAD_HEIGHT + BODY_EXTRA;
// how much of it shows above the bottom edge
const SHOW_REST = 62; // ears to just under the smile
const SHOW_CRANE = 84;
const SHOW_STRAIN = 104;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Same peeking creature as on the machine, this time peeking up from the bottom edge of the screen,
// stretching up to get a look at the cards.
export function CraningCreature({
  lookX,
  lookY,
  straining,
  cardKey,
}: {
  // how far the front card is being dragged (px), so the eyes follow it
  lookX: MotionValue<number>;
  lookY: MotionValue<number>;
  straining: boolean;
  // changes when the active card switches, for a little "ooh" hop
  cardKey: string;
}) {
  const [ref, { height: room }] = useElementSize<HTMLDivElement>();
  // on short screens it rises less rather than getting its ears clipped
  const fit = (show: number) => TOTAL - clamp(show, 0, room - 8);
  const rest = fit(SHOW_REST);
  const crane = fit(SHOW_CRANE);

  const eyeX = useTransform(lookX, (v) => clamp(v / 18, -5, 5));
  // looks up at the cards; strains further up as one is pulled toward the machine
  const eyeY = useTransform(lookY, (v) => clamp(-5 + v / 40, -6, -3));

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 flex justify-center">
      {room > 0 && (
        <div className="absolute bottom-0" style={{ width: HEAD_WIDTH, height: TOTAL }}>
          <motion.div
            initial={{ y: TOTAL }}
            animate={straining ? { y: fit(SHOW_STRAIN) } : { y: [rest, rest, crane, crane, rest] }}
            transition={
              straining
                ? { type: "spring", stiffness: 260, damping: 14 }
                : { duration: 4, repeat: Infinity, times: [0, 0.35, 0.5, 0.75, 1], ease: "easeInOut" }
            }
            className="absolute inset-0"
          >
            <motion.div
              animate={{ rotate: straining ? [-2.5, 2.5, -2.5] : [-5, 5, -5] }}
              transition={{ duration: straining ? 0.5 : 2.6, repeat: Infinity, ease: "easeInOut" }}
              style={{ originY: `${(SHOW_REST / TOTAL) * 100}%` }}
            >
              <motion.div
                key={cardKey}
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 11 }}
              >
                <CreatureHead lookX={eyeX} lookY={eyeY} mouth={straining ? "ooh" : "smile"} bodyExtra={BODY_EXTRA} />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* paws on the bottom edge, pushing up while it strains to see */}
          <div className="absolute -bottom-[3px] left-1/2 z-20 -ml-[24px]">
            <CreaturePaws action={straining ? "push" : "still"} />
          </div>
        </div>
      )}
    </div>
  );
}
