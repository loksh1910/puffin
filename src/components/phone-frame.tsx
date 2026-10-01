"use client";

import { useEffect, useRef, useState } from "react";
import { MotionConfig, motion } from "framer-motion";

const FRAME_W = 432;
const FRAME_H = 880;

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1);
  const frameRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false, pressed: false });

  useEffect(() => {
    const fit = () => {
      // real phones get the app full-bleed; bigger screens get a scaled device mockup
      if (window.innerWidth < 640) return setScale(1);
      setScale(Math.min(1, (window.innerHeight - 40) / FRAME_H, (window.innerWidth - 32) / FRAME_W));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const el = frameRef.current;
    // a real touch device already shows real touches — this fake cursor is only for a mouse,
    // e.g. recording a demo of the prototype
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;

    // same scale correction PhoneFrame already does for drag gestures via transformPagePoint —
    // the frame box is itself CSS-scaled, so page coordinates need dividing by scale to land
    // in its own local (unscaled) coordinate space
    const toLocal = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
    };
    const move = (e: PointerEvent) => setCursor((c) => ({ ...c, ...toLocal(e), visible: true }));
    const leave = () => setCursor((c) => ({ ...c, visible: false }));
    const down = () => setCursor((c) => ({ ...c, pressed: true }));
    const up = () => setCursor((c) => ({ ...c, pressed: false }));

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerenter", move);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerenter", move);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
    };
  }, [scale]);

  return (
    // drag gestures need pointer coords mapped into the scaled frame's space
    <MotionConfig transformPagePoint={(p) => ({ x: p.x / scale, y: p.y / scale })}>
      <div className="flex h-dvh w-full items-center justify-center overflow-hidden">
        <div
          ref={frameRef}
          style={{ transform: scale !== 1 ? `scale(${scale})` : undefined, cursor: "none" }}
          className="relative h-dvh w-full shrink-0 overflow-hidden bg-background
                     sm:h-[880px] sm:w-[432px] sm:rounded-[3rem]
                     sm:border-[10px] sm:border-[#151022]"
        >
          <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 z-40 h-[26px] w-[130px] rounded-b-2xl bg-[#151022]" />
          <div className="relative flex h-full w-full flex-col overflow-hidden">{children}</div>

          {cursor.visible && (
            // mix-blend-difference inverts whatever's underneath, so the ring stays visible
            // whether it's sitting on a white card, a purple gradient, or dark chrome — a flat
            // translucent fill looked fine on the pink page background but nearly vanished on
            // the balance card's own purple gradient
            <motion.div
              aria-hidden
              className="pointer-events-none absolute z-[999] rounded-full border-2 border-white mix-blend-difference"
              style={{ left: cursor.x, top: cursor.y, translateX: "-50%", translateY: "-50%" }}
              animate={{ width: cursor.pressed ? 22 : 30, height: cursor.pressed ? 22 : 30, opacity: cursor.pressed ? 1 : 0.85 }}
              transition={{ type: "spring", stiffness: 600, damping: 32 }}
            />
          )}
        </div>
      </div>
    </MotionConfig>
  );
}
