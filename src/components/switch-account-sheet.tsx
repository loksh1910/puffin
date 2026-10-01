"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { Sheet } from "@/components/sheet";
import { CardStack } from "@/components/card-stack";
import { CardFace } from "@/components/bank-card";
import { ReachingCreature } from "@/components/reaching-creature";
import { BANK_ACCOUNTS, BankAccount } from "@/lib/bank-account";

type Phase = "select" | "inserting" | "pin";
const PIN_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];
// short drag: the creature sits close by, not across the whole screen
const INSERT_THRESHOLD = 55;

function SwitchAccountBody({
  currentId,
  onClose,
  onSelect,
}: {
  currentId: string;
  onClose: () => void;
  onSelect: (a: BankAccount) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, BANK_ACCOUNTS.findIndex((a) => a.id === currentId)));
  const [phase, setPhase] = useState<Phase>("select");
  const [drop, setDrop] = useState({ x: 0, y: 0 });
  const [straining, setStraining] = useState(false);
  const [pin, setPin] = useState("");
  const lookX = useMotionValue(0);
  const lookY = useMotionValue(0);

  const account = BANK_ACCOUNTS[activeIndex];
  const pinDone = pin.length >= 4;

  useEffect(() => {
    if (pin.length < 4) return;
    const t = setTimeout(() => onSelect(account), 550);
    return () => clearTimeout(t);
  }, [pin, account, onSelect]);

  const press = (key: string) => {
    if (!key || pinDone) return;
    if (key === "⌫") return setPin((p) => p.slice(0, -1));
    setPin((p) => p + key);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-6">
      {/* everything below sits low on the screen (thumb-friendly), not spread across it */}
      <div className="flex shrink-0 items-center justify-between px-5 pb-0.5">
        <p className="text-[15px] font-bold text-foreground">Choose an account</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-primary transition-transform active:scale-90"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex justify-center">
        <ReachingCreature lookX={lookX} lookY={lookY} reaching={straining} />
      </div>

      <div className="relative mt-1 h-[150px] shrink-0">
        <AnimatePresence>
          {phase === "select" && (
            <motion.div key="stack" exit={{ opacity: 0, transition: { duration: 0.12 } }} className="absolute inset-x-0 top-0">
              <CardStack
                cards={BANK_ACCOUNTS}
                activeIndex={activeIndex}
                onSwitch={setActiveIndex}
                insertThreshold={INSERT_THRESHOLD}
                onInsert={(offset) => {
                  setDrop(offset);
                  setPhase("inserting");
                }}
                onDragMove={(o) => {
                  lookX.set(Math.max(-5, Math.min(5, o.x / 14)));
                  lookY.set(Math.max(-4, Math.min(2, o.y / 30)));
                }}
                onDragStateChange={(dragging) => {
                  setStraining(dragging);
                  if (!dragging) {
                    lookX.set(0);
                    lookY.set(0);
                  }
                }}
                kind="Savings Account"
              />
              <motion.p
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="mt-3 text-center text-[11.5px] font-medium text-muted-foreground"
              >
                ← swipe to switch · drag up a bit ↑
              </motion.p>
            </motion.div>
          )}

          {phase === "inserting" && (
            <motion.div
              key="flying"
              initial={{ x: drop.x, y: drop.y, scale: 1.03, opacity: 1 }}
              animate={{ x: 0, y: -110, scale: 0.35, opacity: [1, 1, 0] }}
              transition={{ duration: 0.38, ease: [0.5, 0, 0.75, 0] }}
              onAnimationComplete={() => setPhase("pin")}
              className="absolute inset-x-0 top-0 z-20 mx-auto w-[240px]"
            >
              <CardFace card={account} kind="Savings Account" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {phase === "pin" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="shrink-0 px-6"
          >
            <p className="mb-2 text-center text-[12px] font-semibold text-foreground">
              Enter PIN for {account.bank} •••• {account.last4}
            </p>
            <div className="mb-3 flex justify-center gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <motion.span
                  key={i}
                  animate={{
                    scale: i < pin.length ? [1, 1.3, 1] : 1,
                    backgroundColor: i < pin.length ? "#9333ea" : "#e6d7ef",
                  }}
                  transition={{ duration: 0.2 }}
                  className="h-3 w-3 rounded-full"
                />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1">
              {PIN_KEYS.map((k, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={!k || pinDone}
                  onClick={() => press(k)}
                  className="flex h-11 items-center justify-center rounded-2xl text-[18px] font-semibold text-foreground transition-colors active:bg-accent disabled:opacity-0"
                >
                  {k}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SwitchAccountSheet({
  open,
  currentId,
  onClose,
  onSelect,
}: {
  open: boolean;
  currentId: string;
  onClose: () => void;
  onSelect: (a: BankAccount) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose}>
      <SwitchAccountBody currentId={currentId} onClose={onClose} onSelect={onSelect} />
    </Sheet>
  );
}
