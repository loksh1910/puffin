"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import type { Person } from "@/lib/split-types";

// one distinct colour per squad member, in member order (stays readable next to each other)
export const SLICE_COLORS = ["#6a3de8", "#ff5fa2", "#f59e0b", "#14b8a6", "#0ea5e9", "#c026d3", "#84cc16", "#f97316"];

const SPRING = { stiffness: 170, damping: 22 };

// 0° = 12 o'clock, clockwise
const polar = (c: number, r: number, deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: c + r * Math.sin(rad), y: c - r * Math.cos(rad) };
};

function arcPath(c: number, r: number, a0: number, a1: number) {
  const sweep = a1 - a0;
  if (sweep <= 0.05) return `M${c} ${c}`;
  if (sweep >= 359.95) return `M${c - r} ${c}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  const p0 = polar(c, r, a0);
  const p1 = polar(c, r, a1);
  return `M${c} ${c}L${p0.x} ${p0.y}A${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${p1.x} ${p1.y}Z`;
}

function Slice({
  start,
  end,
  c,
  r,
  color,
  label,
  explode,
}: {
  start: number;
  end: number;
  c: number;
  r: number;
  color: string;
  label: string | null;
  explode: boolean;
}) {
  const s = useSpring(start, SPRING);
  const e = useSpring(end, SPRING);
  useEffect(() => s.set(start), [start, s]);
  useEffect(() => e.set(end), [end, e]);

  const d = useTransform([s, e], ([a, b]: number[]) => arcPath(c, r, a, b));
  const lx = useTransform([s, e], ([a, b]: number[]) => polar(c, r * 0.64, (a + b) / 2).x);
  const ly = useTransform([s, e], ([a, b]: number[]) => polar(c, r * 0.64, (a + b) / 2).y);
  const labelOpacity = useTransform([s, e], ([a, b]: number[]) => (b - a > 22 ? 1 : 0));
  const push = polar(0, 20, (start + end) / 2);

  return (
    <motion.g
      animate={explode && end - start > 0.5 ? { x: push.x, y: push.y } : { x: 0, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 13 }}
    >
      <motion.path d={d} fill={color} stroke="#fff8ea" strokeWidth={r > 40 ? 2.5 : 1.5} strokeLinejoin="round" />
      {label && (
        <motion.g style={{ opacity: labelOpacity }}>
          <motion.circle cx={lx} cy={ly} r={11} fill="white" />
          <motion.text x={lx} y={ly} dy="0.36em" textAnchor="middle" fontSize="9" fontWeight="800" fill={color}>
            {label}
          </motion.text>
        </motion.g>
      )}
    </motion.g>
  );
}

export function PizzaChart({
  parts,
  size = 170,
  explode = false,
  children,
}: {
  parts: { person: Person; value: number; color: string }[];
  size?: number;
  // slices spring apart, for the "sliced!" moment
  explode?: boolean;
  // shown in a badge at the centre
  children?: React.ReactNode;
}) {
  const c = size / 2;
  const sum = parts.reduce((t, p) => t + p.value, 0);
  const sweeps = parts.map((p) => (sum > 0 ? (p.value / sum) * 360 : 360 / parts.length));
  const slices = parts.map((p, i) => {
    const start = sweeps.slice(0, i).reduce((a, b) => a + b, 0);
    return { ...p, start, end: start + sweeps[i] };
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible drop-shadow-[0_10px_18px_rgba(90,30,140,0.25)]">
        {/* crust */}
        <circle cx={c} cy={c} r={c} fill="#e9b26b" />
        <circle cx={c} cy={c} r={c - 3} fill="#f3c98b" />
        {slices.map((s) => (
          <Slice
            key={s.person.id}
            start={s.start}
            end={s.end}
            c={c}
            r={c - 7}
            color={s.color}
            label={size >= 120 ? (s.person.id === "me" ? "You" : s.person.initials) : null}
            explode={explode}
          />
        ))}
      </svg>
      {children && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl bg-white/95 px-2.5 py-1 text-center shadow-md">{children}</div>
        </div>
      )}
    </div>
  );
}
