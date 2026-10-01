"use client";

import { motion, AnimatePresence, MotionValue, useTransform } from "framer-motion";
import { CREATURE } from "@/components/creature-ball";

export const HEAD_WIDTH = 96;
export const HEAD_HEIGHT = 78;

// The mascot's signature "peeking" shape: dome head with flat sides that carry on down as its body.
// Used wherever it peeks over an edge (the machine, the bottom of the card screen).
export function CreatureHead({
  lookX,
  lookY,
  eyes = "open",
  mouth = "smile",
  bodyExtra = 0,
}: {
  // pupil offset from the centre of each eye, roughly ±5
  lookX: MotionValue<number>;
  lookY: MotionValue<number>;
  // happy = ^ ^ (pleased/embarrassed), sleepy = relaxed ‿ ‿ lids, covering = paws over the eyes
  eyes?: "open" | "happy" | "sleepy" | "covering";
  mouth?: "smile" | "ooh" | "snore";
  // extends the flat-sided body below the face, for when it rises and more of it shows
  bodyExtra?: number;
}) {
  const leftX = useTransform(lookX, (v) => 35 + v);
  const rightX = useTransform(lookX, (v) => 61 + v);
  const pupilY = useTransform(lookY, (v) => 40 + v);
  const leftShine = useTransform(leftX, (v) => v - 2);
  const rightShine = useTransform(rightX, (v) => v - 2);
  const shineY = useTransform(pupilY, (v) => v - 2);
  const height = HEAD_HEIGHT + bodyExtra;

  return (
    <svg width={HEAD_WIDTH} height={height} viewBox={`0 0 ${HEAD_WIDTH} ${height}`}>
      <ellipse cx="26" cy="16" rx="9" ry="12" fill={CREATURE.body} transform="rotate(-18 26 16)" />
      <ellipse cx="70" cy="16" rx="9" ry="12" fill={CREATURE.body} transform="rotate(18 70 16)" />
      <ellipse cx="26" cy="17" rx="4" ry="6.5" fill={CREATURE.innerEar} transform="rotate(-18 26 17)" />
      <ellipse cx="70" cy="17" rx="4" ry="6.5" fill={CREATURE.innerEar} transform="rotate(18 70 17)" />
      <path d={`M8 44C8 24 25 12 48 12s40 12 40 32v${34 + bodyExtra}H8V44z`} fill={CREATURE.body} />
      <ellipse cx="20" cy="52" rx="6" ry="4" fill={CREATURE.cheek} opacity="0.6" />
      <ellipse cx="76" cy="52" rx="6" ry="4" fill={CREATURE.cheek} opacity="0.6" />

      <AnimatePresence mode="wait" initial={false}>
        {eyes === "open" && (
          <motion.g key="open" exit={{ opacity: 0 }}>
            <circle cx="35" cy="40" r="13" fill="white" />
            <circle cx="61" cy="40" r="13" fill="white" />
            <motion.circle cx={leftX} cy={pupilY} r="6" fill={CREATURE.ink} />
            <motion.circle cx={rightX} cy={pupilY} r="6" fill={CREATURE.ink} />
            <motion.circle cx={leftShine} cy={shineY} r="1.8" fill="white" />
            <motion.circle cx={rightShine} cy={shineY} r="1.8" fill="white" />
            <motion.rect
              x="20" y="26" width="56" height="0" fill={CREATURE.body}
              animate={{ height: [0, 0, 28, 0, 0] }}
              transition={{ duration: 3.4, repeat: Infinity, times: [0, 0.9, 0.94, 0.98, 1] }}
            />
          </motion.g>
        )}
        {eyes === "covering" && (
          <motion.g key="covering" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <ellipse cx="35" cy="39" rx="14.5" ry="11.5" fill={CREATURE.body} stroke={CREATURE.bodyDark} strokeWidth="1.4" />
            <ellipse cx="61" cy="39" rx="14.5" ry="11.5" fill={CREATURE.body} stroke={CREATURE.bodyDark} strokeWidth="1.4" />
            <path d="M29 33v6M35 32v7M41 33v6" stroke={CREATURE.bodyDark} strokeWidth="1.3" strokeLinecap="round" />
            <path d="M55 33v6M61 32v7M67 33v6" stroke={CREATURE.bodyDark} strokeWidth="1.3" strokeLinecap="round" />
          </motion.g>
        )}
        {(eyes === "happy" || eyes === "sleepy") && (
          <motion.g
            key={eyes}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            stroke={CREATURE.ink}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          >
            {eyes === "happy" ? (
              <>
                <path d="M27 42q8-7 16 0" />
                <path d="M53 42q8-7 16 0" />
              </>
            ) : (
              <>
                <path d="M27 40q8 6 16 0" />
                <path d="M53 40q8 6 16 0" />
              </>
            )}
          </motion.g>
        )}
      </AnimatePresence>

      {mouth === "smile" && (
        <path d="M44 56q4 3 8 0" stroke={CREATURE.ink} strokeWidth="2" strokeLinecap="round" fill="none" />
      )}
      {mouth === "ooh" && (
        <g>
          <ellipse cx="48" cy="58" rx="4" ry="4.5" fill={CREATURE.ink} />
          <ellipse cx="48" cy="60.5" rx="2.6" ry="1.6" fill={CREATURE.cheek} />
        </g>
      )}
      {mouth === "snore" && (
        <motion.ellipse
          cx="48"
          cy="57"
          rx="2.6"
          fill={CREATURE.ink}
          initial={{ ry: 1.4 }}
          animate={{ ry: [1.4, 2.6, 1.4] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </svg>
  );
}

const PAW_MOTION = {
  still: null,
  // hand-over-hand along a ledge
  shimmy: { y: [0, -5, 0, 0], duration: 0.85, stagger: 0.425 },
  // pushing up on the ledge to see over it
  push: { y: [0, -3, 0], duration: 0.3, stagger: 0.15 },
};

// Paws that grip whatever edge the creature is peeking over.
export function CreaturePaws({ action = "still" }: { action?: keyof typeof PAW_MOTION }) {
  const m = PAW_MOTION[action];
  return (
    <div className="flex gap-3">
      {[0, 1].map((i) => (
        <motion.svg
          key={i}
          width="18"
          height="14"
          viewBox="0 0 18 14"
          animate={m ? { y: m.y } : { y: 0 }}
          transition={m ? { duration: m.duration, repeat: Infinity, delay: i * m.stagger, ease: "easeInOut" } : { duration: 0.2 }}
        >
          <path d="M1 13V7a8 6 0 0116 0v6z" fill={CREATURE.body} stroke={CREATURE.bodyDark} strokeWidth="1.2" />
          <path d="M6 5v3M9 4.5v3.5M12 5v3" stroke={CREATURE.bodyDark} strokeWidth="1.2" strokeLinecap="round" />
        </motion.svg>
      ))}
    </div>
  );
}
