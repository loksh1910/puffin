"use client";

import { useEffect, useState } from "react";
import { animate, motion, AnimatePresence, useMotionValue } from "framer-motion";
import { StatusBar } from "@/components/status-bar";
import { PosMachine, MachinePhase, KeyPress, MachineKey } from "@/components/pos-machine";
import { CardStack } from "@/components/card-stack";
import { CardFace } from "@/components/bank-card";
import { cards } from "@/lib/cards-data";
import { formatINR } from "@/lib/format";
import { useElementSize } from "@/lib/use-element-size";
import { SwipeToPay } from "@/components/swipe-to-pay";
import { CraningCreature } from "@/components/craning-creature";
import { useToast } from "@/components/toast";
import type { Person } from "@/lib/split-types";

const PIN_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];
// machine's own top margin plus a little breathing room below it
const STAGE_PADDING = 40 + 16;
// long enough for the creature's "I saw nothing" beat before it hops down into the slider
const HOP_DELAY = 1300;

export function CheckoutScreen({
  amount,
  recipient,
  onBack,
  onComplete,
}: {
  amount: number;
  recipient: Person;
  onBack: () => void;
  onComplete: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<MachinePhase>("select");
  const [drop, setDrop] = useState({ x: 0, y: 0 });
  const [pin, setPin] = useState("");
  const [pressed, setPressed] = useState<KeyPress>(null);
  const [confirming, setConfirming] = useState(false);
  const [hopped, setHopped] = useState(false);
  const [hint, setHint] = useState(0);
  const [stageRef, { height: stageHeight }] = useElementSize<HTMLDivElement>();
  const [straining, setStraining] = useState(false);
  const lookX = useMotionValue(0);
  const lookY = useMotionValue(0);
  const toast = useToast();

  const zoomed = phase === "zoom-pin";
  const pinDone = pin.length >= 4;
  const inSlider = pinDone && hopped;
  const card = cards[activeIndex];

  useEffect(() => {
    if (phase !== "swiping") return;
    const t = setTimeout(() => setPhase("zoom-pin"), 1000);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (!pinDone) return;
    const t = setTimeout(() => setHopped(true), HOP_DELAY);
    return () => clearTimeout(t);
  }, [pinDone]);

  // let the creature's victory hop play before moving on
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(onComplete, 1000);
    return () => clearTimeout(t);
  }, [confirming, onComplete]);

  const flash = (key: string) => setPressed((prev) => ({ key, n: (prev?.n ?? 0) + 1 }));

  const handleKey = (key: MachineKey) => {
    if (confirming) return;
    if (key === "cancel") return onBack();
    if (key === "confirm") {
      // paying is the creature's job now — nudge the user toward it
      if (!inSlider) return;
      flash("✓");
      setHint((h) => h + 1);
      return;
    }
    if (key === "⌫") {
      flash("⌫");
      setHopped(false);
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pinDone) return;
    flash(key);
    setPin((p) => p + key);
  };

  const handleSwiped = () => {
    flash("✓");
    setConfirming(true);
  };

  const changeCard = () => {
    setPin("");
    setPressed(null);
    setHopped(false);
    setPhase("select");
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <StatusBar />
      <div className="relative z-30 flex items-center gap-3 px-5 pt-3">
        <button
          type="button"
          onClick={onBack}
          disabled={phase === "inserting" || phase === "swiping" || confirming}
          aria-label={zoomed ? "Cancel payment" : "Back"}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-0 ${
            zoomed ? "bg-card text-foreground shadow-md shadow-black/10" : "bg-accent text-primary"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {zoomed ? (
              <motion.svg key="close" initial={{ rotate: -90, scale: 0.5 }} animate={{ rotate: 0, scale: 1 }} width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
              </motion.svg>
            ) : (
              <motion.svg key="back" initial={{ scale: 0.5 }} animate={{ scale: 1 }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
            )}
          </AnimatePresence>
        </button>
        <motion.p animate={{ opacity: zoomed ? 0 : 1 }} className="text-[14px] font-semibold text-foreground">
          Paying {recipient.name}
        </motion.p>
      </div>

      <motion.div
        initial={false}
        animate={{ height: zoomed ? 0 : "auto", opacity: zoomed ? 0 : 1 }}
        className="shrink-0 overflow-hidden text-center"
      >
        <p className="pt-1 text-[13px] text-muted-foreground">Amount</p>
        <p className="text-[32px] font-bold tabular-nums text-foreground">₹{formatINR(amount)}</p>
      </motion.div>

      <div ref={stageRef} className="relative flex min-h-0 flex-1 flex-col">
        <PosMachine
          phase={phase}
          amount={amount}
          pinLength={pin.length}
          pressed={pressed}
          maxHeight={stageHeight - STAGE_PADDING}
          creatureGone={inSlider}
          onKey={handleKey}
        />

        {!zoomed && (
          <div className="relative mt-9 h-[170px] shrink-0">
            <AnimatePresence>
              {phase === "select" && (
                <motion.div
                  key="stack"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  className="absolute inset-x-0 top-0"
                >
                  <CardStack
                    cards={cards}
                    activeIndex={activeIndex}
                    onSwitch={setActiveIndex}
                    onInsert={(offset) => {
                      setDrop(offset);
                      setPhase("inserting");
                    }}
                    onDragMove={(o) => {
                      lookX.set(o.x);
                      lookY.set(o.y);
                    }}
                    onDragStateChange={(dragging) => {
                      setStraining(dragging);
                      if (!dragging) {
                        animate(lookX, 0, { duration: 0.4 });
                        animate(lookY, 0, { duration: 0.4 });
                      }
                    }}
                  />
                  <motion.p
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    className="mt-4 text-center text-[12px] font-medium text-muted-foreground"
                  >
                    ← swipe to switch · drag up to pay ↑
                  </motion.p>
                </motion.div>
              )}

              {phase === "inserting" && (
                <motion.div
                  key="flying"
                  initial={{ x: drop.x, y: drop.y, scale: 1.03, opacity: 1 }}
                  animate={{ x: 0, y: -300, scale: 0.4, opacity: [1, 1, 0] }}
                  transition={{ duration: 0.45, ease: [0.5, 0, 0.75, 0] }}
                  onAnimationComplete={() => setPhase("swiping")}
                  className="absolute inset-x-0 top-0 z-20 mx-auto w-[240px]"
                >
                  <CardFace card={card} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <AnimatePresence>
          {phase === "select" && (
            <motion.div
              key="add-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              className="flex shrink-0 justify-center"
            >
              <button
                type="button"
                onClick={() => toast("Adding cards is coming soon ✨")}
                className="flex items-center gap-1.5 rounded-full border-2 border-dashed border-primary/30 bg-card/70 px-5 py-2.5 text-[13px] font-semibold text-primary transition-all hover:border-primary/60 active:scale-95"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                </svg>
                Add another card
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* whatever space is left at the bottom is the creature's; on short screens it just peeks less */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <AnimatePresence>
            {phase === "select" && (
              <motion.div
                key="craner"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%", transition: { duration: 0.3, ease: "easeIn" } }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
                className="absolute inset-0"
              >
                <CraningCreature lookX={lookX} lookY={lookY} straining={straining} cardKey={card.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {zoomed && (
          <motion.div
            key="pin-ui"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40, transition: { duration: 0.15 } }}
            transition={{ delay: 0.25, type: "spring", stiffness: 260, damping: 26 }}
            className="shrink-0"
          >
            {/* which card is paying, with a way back to the card picker */}
            <div className="mx-5 mb-3 flex items-center gap-3 rounded-2xl bg-card px-3 py-2.5 shadow-sm shadow-black/5">
              <span className="h-7 w-10 shrink-0 rounded-md shadow-sm" style={{ background: card.gradient }} />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[13px] font-semibold text-foreground">{card.bankFullName}</p>
                <p className="text-[11px] text-muted-foreground">Credit card •••• {card.last4}</p>
              </div>
              <button
                type="button"
                onClick={changeCard}
                disabled={confirming}
                className="rounded-full bg-accent px-3.5 py-1.5 text-[12px] font-semibold text-primary transition-transform active:scale-95"
              >
                Change
              </button>
            </div>

            <div className="rounded-t-[28px] bg-card px-6 pb-7 pt-3.5 shadow-[0_-8px_30px_rgba(80,20,110,0.08)]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={pinDone ? "ready" : "typing"}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mb-1.5 text-center text-[11.5px] font-medium text-muted-foreground"
                >
                  {pinDone ? "PIN done! Hold your buddy and swipe to pay 👇" : "Cover your screen — someone's peeking 👀"}
                </motion.p>
              </AnimatePresence>
              <div className="grid grid-cols-3 gap-1">
                {PIN_KEYS.map((key, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={!key || (pinDone && key !== "⌫")}
                    onClick={() => handleKey(key)}
                    className="flex h-12 items-center justify-center rounded-2xl text-[19px] font-semibold text-foreground transition-colors active:bg-accent disabled:opacity-30 [&:disabled:empty]:opacity-0"
                  >
                    {key}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <SwipeToPay
                  amount={amount}
                  status={inSlider ? "ready" : pinDone ? "arriving" : "locked"}
                  hint={hint}
                  onSwiped={handleSwiped}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
