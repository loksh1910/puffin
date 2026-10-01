"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sheet } from "@/components/sheet";
import { formatINR } from "@/lib/format";
import { dueDateLabel } from "@/lib/reminders";
import { startOfDay } from "@/lib/date";
import type { Subscription } from "@/lib/subscriptions-store";

type View = "info" | "confirm-remove";

function DetailBody({
  item,
  onRemoveAutopay,
  onPay,
}: {
  item: Subscription;
  onRemoveAutopay: (item: Subscription) => void;
  onPay: (item: Subscription) => void;
}) {
  const [today] = useState(() => startOfDay(new Date()));
  const [view, setView] = useState<View>("info");

  return (
    <div className="px-5 pb-8 pt-3">
      <AnimatePresence mode="wait" initial={false}>
        {view === "confirm-remove" ? (
          <motion.div key="confirm" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
            <p className="text-[16px] font-bold text-foreground">Turn off autopay for {item.label}?</p>
            <p className="mt-1.5 text-[12.5px] text-muted-foreground">
              You&apos;ll need to pay manually every {item.frequency === "yearly" ? "year" : "month"} — Fin won&apos;t charge your card automatically anymore.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setView("info")}
                className="flex-1 rounded-full bg-muted py-3.5 text-[14px] font-semibold text-foreground transition-transform active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemoveAutopay(item);
                  setView("info");
                }}
                className="flex-1 rounded-full bg-danger py-3.5 text-[14px] font-semibold text-white transition-transform active:scale-[0.98]"
              >
                Turn off
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="info" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }}>
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-[26px]" style={{ background: item.bg }}>
                {item.emoji}
              </span>
              <div className="leading-tight">
                <p className="text-[17px] font-bold text-foreground">{item.label}</p>
                <p className="text-[12px] text-muted-foreground">{item.frequency === "yearly" ? "Renews yearly" : "Renews monthly"}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-3xl bg-muted/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-muted-foreground">Renews</span>
                <span className="text-[13.5px] font-semibold text-foreground">{dueDateLabel(item, today)}</span>
              </div>
              <div className="h-px bg-border/60" />
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-muted-foreground">Amount</span>
                <span className="text-[17px] font-extrabold tabular-nums text-foreground">₹{formatINR(item.amount)}</span>
              </div>
              <div className="h-px bg-border/60" />
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-muted-foreground">Autopay</span>
                <span className={`text-[13px] font-bold ${item.autopay ? "text-success" : "text-muted-foreground"}`}>{item.autopay ? "On" : "Off"}</span>
              </div>
            </div>

            {item.autopay ? (
              <button
                type="button"
                onClick={() => setView("confirm-remove")}
                className="mt-5 w-full rounded-full bg-muted py-4 text-[14.5px] font-semibold text-danger transition-transform active:scale-[0.98]"
              >
                Remove autopay
              </button>
            ) : (
              <button
                type="button"
                disabled={item.paid}
                onClick={() => onPay(item)}
                className="mt-5 w-full rounded-full bg-gradient-to-r from-primary to-secondary py-4 text-[14.5px] font-semibold text-white shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
              >
                {item.paid ? "Already paid ✓" : `Pay ₹${formatINR(item.amount)}`}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SubscriptionDetailSheet({
  item,
  onClose,
  onRemoveAutopay,
  onPay,
}: {
  item: Subscription | null;
  onClose: () => void;
  onRemoveAutopay: (item: Subscription) => void;
  onPay: (item: Subscription) => void;
}) {
  return (
    <Sheet open={!!item} onClose={onClose}>
      {item && <DetailBody item={item} onRemoveAutopay={onRemoveAutopay} onPay={onPay} />}
    </Sheet>
  );
}
