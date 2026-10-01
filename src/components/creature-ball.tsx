"use client";

import { motion, AnimatePresence, MotionValue, useTransform } from "framer-motion";

export const CREATURE = {
  body: "#a970ff",
  bodyDark: "#8a4fe0",
  innerEar: "#ffb3d9",
  cheek: "#ff8bc6",
  ink: "#26163a",
};

export type Mood = "idle" | "dragging" | "armed" | "happy";
// pupil offset from centre, in the 64-unit viewBox (roughly ±4 stays inside the eye)
export type Gaze = { x: MotionValue<number>; y: MotionValue<number> };

function SteeredEyes({ gaze, pupilR }: { gaze: Gaze; pupilR: number }) {
  const lx = useTransform(gaze.x, (v) => 24 + v);
  const rx = useTransform(gaze.x, (v) => 40 + v);
  const py = useTransform(gaze.y, (v) => 34 + v);
  const lShine = useTransform(lx, (v) => v - 1.5);
  const rShine = useTransform(rx, (v) => v - 1.5);
  const shineY = useTransform(py, (v) => v - 2);
  return (
    <>
      <motion.circle cx={lx} cy={py} r={pupilR} fill={CREATURE.ink} />
      <motion.circle cx={rx} cy={py} r={pupilR} fill={CREATURE.ink} />
      <motion.circle cx={lShine} cy={shineY} r="1.5" fill="white" />
      <motion.circle cx={rShine} cy={shineY} r="1.5" fill="white" />
    </>
  );
}

// Round, full-body version of the mascot: swipe-to-pay thumb, loading courier, success cheer, card-screen periscope.
export function CreatureBall({
  mood,
  size = 56,
  gaze,
  cheer = false,
}: {
  mood: Mood;
  size?: number;
  gaze?: Gaze;
  cheer?: boolean;
}) {
  const look = mood === "idle" ? 2.5 : 3.8; // default: pupils lean toward the swipe direction
  const pupilR = mood === "armed" ? 5.2 : 4.4;

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="overflow-visible drop-shadow-[0_6px_8px_rgba(90,30,140,0.35)]">
      {cheer &&
        [
          { cx: 7, delay: 0 },
          { cx: 57, delay: 0.2 },
        ].map((paw) => (
          <motion.ellipse
            key={paw.cx}
            cx={paw.cx}
            cy="30"
            rx="5.5"
            ry="7.5"
            fill={CREATURE.body}
            stroke={CREATURE.bodyDark}
            strokeWidth="1.2"
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: paw.delay, ease: "easeInOut" }}
          />
        ))}
      <ellipse cx="17" cy="15" rx="7" ry="10" fill={CREATURE.body} transform="rotate(-20 17 15)" />
      <ellipse cx="47" cy="15" rx="7" ry="10" fill={CREATURE.body} transform="rotate(20 47 15)" />
      <ellipse cx="17" cy="16" rx="3.2" ry="5.5" fill={CREATURE.innerEar} transform="rotate(-20 17 16)" />
      <ellipse cx="47" cy="16" rx="3.2" ry="5.5" fill={CREATURE.innerEar} transform="rotate(20 47 16)" />
      <circle cx="32" cy="37" r="24" fill={CREATURE.body} />
      <ellipse cx="15.5" cy="45" rx="5" ry="3.4" fill={CREATURE.cheek} opacity={mood === "armed" || mood === "happy" ? 0.9 : 0.55} />
      <ellipse cx="48.5" cy="45" rx="5" ry="3.4" fill={CREATURE.cheek} opacity={mood === "armed" || mood === "happy" ? 0.9 : 0.55} />

      <AnimatePresence mode="wait" initial={false}>
        {mood === "happy" ? (
          <motion.g
            key="happy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            stroke={CREATURE.ink}
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          >
            <path d="M18.5 35q5.5-6 11 0" />
            <path d="M34.5 35q5.5-6 11 0" />
          </motion.g>
        ) : (
          <motion.g key="open" exit={{ opacity: 0 }}>
            <circle cx="24" cy="34" r="8.5" fill="white" />
            <circle cx="40" cy="34" r="8.5" fill="white" />
            {gaze ? (
              <SteeredEyes gaze={gaze} pupilR={pupilR} />
            ) : (
              <>
                <motion.circle animate={{ cx: 24 + look, r: pupilR }} initial={false} cy="35" fill={CREATURE.ink} />
                <motion.circle animate={{ cx: 40 + look, r: pupilR }} initial={false} cy="35" fill={CREATURE.ink} />
                <motion.circle animate={{ cx: 22.5 + look }} initial={false} cy="33" r="1.5" fill="white" />
                <motion.circle animate={{ cx: 38.5 + look }} initial={false} cy="33" r="1.5" fill="white" />
              </>
            )}
            {mood === "idle" && (
              <motion.rect
                x="14" y="24" width="36" height="0" fill={CREATURE.body}
                animate={{ height: [0, 0, 20, 0, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.88, 0.93, 0.97, 1] }}
              />
            )}
          </motion.g>
        )}
      </AnimatePresence>

      {mood === "idle" && <path d="M28.5 46q3.5 3 7 0" stroke={CREATURE.ink} strokeWidth="2" strokeLinecap="round" fill="none" />}
      {mood === "dragging" && (
        <g>
          <ellipse cx="32" cy="47" rx="3.4" ry="3.8" fill={CREATURE.ink} />
          <ellipse cx="32" cy="49.2" rx="2.2" ry="1.4" fill={CREATURE.cheek} />
        </g>
      )}
      {(mood === "armed" || mood === "happy") && (
        <path d="M25.5 44.5q6.5 8 13 0z" fill={CREATURE.ink} stroke={CREATURE.ink} strokeWidth="1.5" strokeLinejoin="round" />
      )}
    </svg>
  );
}
