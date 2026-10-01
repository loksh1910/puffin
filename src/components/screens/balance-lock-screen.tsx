"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBar } from "@/components/status-bar";
import { BANK_ACCOUNTS } from "@/lib/bank-account";

// the outer gate is always the primary account; switching happens after unlocking
const account = BANK_ACCOUNTS[0];

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export function BalanceLockScreen({ onBack, onUnlock }: { onBack: () => void; onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [scanning, setScanning] = useState(false);
  // derived, not stored: true for the brief moment between the 4th digit and unlocking
  const verifying = pin.length >= 4;
  const busy = scanning || verifying;

  useEffect(() => {
    if (pin.length < 4) return;
    const t = setTimeout(onUnlock, 500);
    return () => clearTimeout(t);
  }, [pin, onUnlock]);

  useEffect(() => {
    if (!scanning) return;
    const t = setTimeout(onUnlock, 950);
    return () => clearTimeout(t);
  }, [scanning, onUnlock]);

  const press = (key: string) => {
    if (!key || busy) return;
    if (key === "⌫") return setPin((p) => p.slice(0, -1));
    if (pin.length >= 4) return;
    setPin((p) => p + key);
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 pt-3">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-primary transition-transform active:scale-90 disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="text-[14px] font-semibold text-foreground">Account Security</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/25">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="9" rx="2.5" stroke="currentColor" strokeWidth="2" />
            <path d="M8 11V8a4 4 0 118 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <p className="mt-4 text-[16px] font-bold text-foreground">Enter PIN to view balance</p>
        <p className="mt-1 text-center text-[12px] text-muted-foreground">
          {account.bank} •••• {account.last4}
        </p>

        <div className="mt-6 flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.span
              key={i}
              animate={{
                scale: i < pin.length ? [1, 1.3, 1] : 1,
                backgroundColor: i < pin.length ? "#9333ea" : "#e6d7ef",
              }}
              transition={{ duration: 0.2 }}
              className="h-3.5 w-3.5 rounded-full"
            />
          ))}
        </div>

        <div className="mt-3 h-5">
          <AnimatePresence>
            {busy && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[12.5px] font-semibold text-primary"
              >
                Verifying…
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="pb-3">
        <motion.button
          type="button"
          onClick={() => setScanning(true)}
          disabled={busy}
          whileTap={{ scale: 0.95 }}
          className="mx-auto flex flex-col items-center gap-1.5 disabled:opacity-50"
        >
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
            {scanning && (
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-primary"
                animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
            )}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M12 2a7 7 0 00-7 7v2c0 2.8 1 5.3 2.6 7.2" />
              <path d="M12 5a4 4 0 00-4 4v2c0 2.6.8 5 2.2 7" />
              <path d="M12 5a4 4 0 014 4v1.5" />
              <path d="M16 15.5c-.3 1.7-1 3.3-2.1 4.7" />
              <path d="M12 9a2 2 0 00-2 2v1.5c0 2.3.6 4.5 1.7 6.4" />
              <path d="M14 12v.8c0 2.6-.7 5.1-2 7.2" />
              <path d="M19 9v2c0 3-.7 5.7-2 8" />
            </svg>
          </span>
          <span className="text-[11.5px] font-semibold text-muted-foreground">Use fingerprint</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-3 gap-1 px-8 pb-8">
        {KEYS.map((key, i) => (
          <button
            key={i}
            type="button"
            disabled={!key || busy}
            onClick={() => press(key)}
            className="flex h-14 items-center justify-center rounded-2xl text-[19px] font-semibold text-foreground transition-colors active:bg-accent disabled:opacity-0"
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
