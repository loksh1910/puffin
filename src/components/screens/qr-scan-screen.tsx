"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBar } from "@/components/status-bar";
import { QR_RECIPIENT } from "@/lib/contacts";

const QR_SIZE = 21;
const QR_CELLS = Array.from({ length: QR_SIZE * QR_SIZE }, (_, i) => {
  const r = Math.floor(i / QR_SIZE);
  const c = i % QR_SIZE;
  const inFinder = (r < 8 && c < 8) || (r < 8 && c >= QR_SIZE - 8) || (r >= QR_SIZE - 8 && c < 8);
  if (inFinder) return false;
  return ((r * 7 + c * 13 + r * c) % 5) < 2;
});

function Finder({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width="7" height="7" rx="1.2" fill="#1b0f2b" />
      <rect x={x + 1} y={y + 1} width="5" height="5" rx="0.8" fill="white" />
      <rect x={x + 2} y={y + 2} width="3" height="3" rx="0.6" fill="#1b0f2b" />
    </g>
  );
}

function MockQR() {
  return (
    <svg viewBox={`-1 -1 ${QR_SIZE + 2} ${QR_SIZE + 2}`} className="h-full w-full">
      <rect x="-1" y="-1" width={QR_SIZE + 2} height={QR_SIZE + 2} rx="2" fill="white" />
      {QR_CELLS.map((on, i) =>
        on ? (
          <rect key={i} x={i % QR_SIZE} y={Math.floor(i / QR_SIZE)} width="1" height="1" fill="#1b0f2b" />
        ) : null
      )}
      <Finder x={0} y={0} />
      <Finder x={QR_SIZE - 7} y={0} />
      <Finder x={0} y={QR_SIZE - 7} />
    </svg>
  );
}

export function QRScanScreen({
  onDetected,
  onBack,
}: {
  onDetected: () => void;
  onBack: () => void;
}) {
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDetected(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!detected) return;
    const timer = setTimeout(onDetected, 650);
    return () => clearTimeout(timer);
  }, [detected, onDetected]);

  return (
    <div className="relative flex h-full flex-col bg-[#120a1e] text-white overflow-hidden">
      {/* fake camera texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(147,51,234,0.35),transparent_55%),radial-gradient(circle_at_75%_75%,rgba(255,95,162,0.25),transparent_50%)]" />

      <div className="relative z-10">
        <StatusBar dark />
        <div className="flex items-center justify-between px-5 pt-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur active:scale-90 transition-transform"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 5l-7 7 7 7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p className="text-[13.5px] font-semibold">Scan any QR</p>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur active:scale-90 transition-transform"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 3l2 5 5 .8-3.6 3.5.9 5.2L12 15l-4.3 2.5.9-5.2L5 8.8 10 8l2-5z" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* viewfinder */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-10">
        <button
          type="button"
          onClick={() => !detected && setDetected(true)}
          className="relative h-64 w-64"
          aria-label="Scanning area"
        >
          <motion.div
            className="absolute inset-9 rounded-lg"
            initial={{ filter: "blur(6px)", opacity: 0.35, rotate: -4, scale: 0.9 }}
            animate={
              detected
                ? { filter: "blur(0px)", opacity: 1, rotate: 0, scale: 1 }
                : { filter: "blur(3px)", opacity: 0.55, rotate: [-4, -2, -4], scale: [0.9, 0.93, 0.9] }
            }
            transition={detected ? { duration: 0.25 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <MockQR />
          </motion.div>
          {[
            "top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl",
            "top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl",
            "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl",
            "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl",
          ].map((cls, i) => (
            <motion.div
              key={i}
              className={`absolute h-10 w-10 ${cls}`}
              animate={{
                borderColor: detected ? "#4ade80" : "#ff5fa2",
              }}
              transition={{ duration: 0.25 }}
            />
          ))}

          <AnimatePresence>
            {!detected && (
              <motion.div
                initial={{ top: "8%" }}
                animate={{ top: ["8%", "88%", "8%"] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-3 right-3 h-[3px] rounded-full bg-gradient-to-r from-transparent via-secondary to-transparent shadow-[0_0_12px_2px_rgba(255,95,162,0.7)]"
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {detected && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success shadow-lg">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <motion.p
          key={detected ? "found" : "scanning"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center text-[13.5px] font-medium text-white/85"
        >
          {detected ? `QR found — ${QR_RECIPIENT.name}` : "Point your camera at any UPI QR code"}
        </motion.p>
      </div>

      <div className="relative z-10 pb-9 px-8">
        <button
          type="button"
          className="mx-auto flex items-center gap-1.5 text-[12.5px] font-medium text-white/70"
        >
          Enter UPI ID manually
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
